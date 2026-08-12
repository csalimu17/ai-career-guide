import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getPlan as getBillingPlan, getPlanByPriceId as getBillingPlanByPriceId } from '@/lib/plans';

async function findUserByStripeCustomerId(customerId: string) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0];
}

function getPeriodEndDate(unixSeconds: number | null | undefined) {
  return typeof unixSeconds === 'number' && Number.isFinite(unixSeconds)
    ? new Date(unixSeconds * 1000)
    : null;
}

/**
 * Idempotency guard: claim the event.id by creating a marker doc.
 * `.create()` fails atomically if the doc already exists, so two parallel
 * deliveries of the same event will only let one through.
 * Returns true if this is a fresh event we should process, false if it has
 * already been processed (Stripe should be ack'd with 200).
 */
async function claimEvent(event: Stripe.Event): Promise<boolean> {
  try {
    await db.collection('stripeWebhookEvents').doc(event.id).create({
      type: event.type,
      receivedAt: FieldValue.serverTimestamp(),
      stripeCreated: event.created,
    });
    return true;
  } catch (error: any) {
    // Firestore returns code 6 (ALREADY_EXISTS) when create() collides.
    if (error?.code === 6 || /already exists/i.test(error?.message || '')) {
      console.log(`[Stripe] Skipping duplicate event ${event.id} (${event.type})`);
      return false;
    }
    // Any other error: log and process anyway, since refusing to handle a
    // legitimate event is worse than potentially double-processing it.
    console.error('[Stripe] claimEvent error:', error);
    return true;
  }
}

async function syncSubscriptionState(
  customerId: string,
  subscription: Stripe.Subscription,
  event: Stripe.Event
) {
  const userDoc = await findUserByStripeCustomerId(customerId);
  if (!userDoc) return;

  const activePriceId = subscription.items.data[0]?.price?.id ?? null;
  const metadataPlanId = subscription.metadata?.plan || (userDoc.data() as any)?.plan;
  const activePlan = (activePriceId ? getBillingPlanByPriceId(activePriceId) : null) || (metadataPlanId ? getBillingPlan(metadataPlanId) : null);

  if (!activePlan) return;

  // Ordering guard: Stripe can deliver subscription events out of order.
  // Skip the write if we've already applied an event with a newer
  // event.created timestamp for this customer.
  const existing = userDoc.data() as { lastStripeEventCreated?: number } | undefined;
  if (
    typeof existing?.lastStripeEventCreated === 'number' &&
    existing.lastStripeEventCreated > event.created
  ) {
    console.log(
      `[Stripe] Ignoring stale subscription event ${event.id} (${event.type}) — newer event already applied for customer ${customerId}`
    );
    return;
  }

  await userDoc.ref.set({
    plan: activePlan.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripeSubscriptionStatus: subscription.status ?? null,
    stripePriceId: activePriceId,
    stripeCurrentPeriodEnd: getPeriodEndDate((subscription as any).current_period_end),
    billingNeedsAttention: false,
    lastStripeEvent: event.type,
    lastStripeEventCreated: event.created,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe environment variables are missing');
    return NextResponse.json({ error: 'Webhook configuration incomplete' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Idempotency: refuse to re-process the same event. Stripe re-delivers
  // events that didn't return 2xx within 5s, so replays are common.
  const shouldProcess = await claimEvent(event);
  if (!shouldProcess) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Handle the event
  switch (event.type) {
    case 'setup_intent.created':
      const setupIntent = event.data.object as Stripe.SetupIntent;
      console.log(`SetupIntent was created: ${setupIntent.id}`);
      
      // If we have a customer, we could update their record in Firestore
      if (setupIntent.customer) {
        const customerId = setupIntent.customer as string;
        try {
          const userDoc = await findUserByStripeCustomerId(customerId);

          if (userDoc) {
            await userDoc.ref.update({
              lastStripeEvent: event.type,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        } catch (error) {
          console.error('Error updating user on setup_intent.created:', error);
        }
      }
      break;

    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const plan = session.metadata?.plan ? getBillingPlan(session.metadata.plan) : null;

      if (userId && plan) {
        try {
          const userRef = db.collection('users').doc(userId);
          // Ordering guard: do not let a stale checkout.session.completed
          // overwrite a newer subscription state that's already been written.
          const existing = (await userRef.get()).data() as { lastStripeEventCreated?: number } | undefined;
          if (
            typeof existing?.lastStripeEventCreated === 'number' &&
            existing.lastStripeEventCreated > event.created
          ) {
            console.log(`[Stripe] Ignoring stale checkout.session.completed ${event.id} for user ${userId}`);
            break;
          }

          await userRef.set({
            plan: plan.id,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
            stripeSubscriptionStatus: session.status ?? null,
            lastStripeEvent: event.type,
            lastStripeEventCreated: event.created,
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
          console.log(`Successfully updated plan to ${plan.id} for user ${userId}`);
        } catch (error) {
          console.error('Error updating user on checkout.session.completed:', error);
        }
      }
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      if (typeof updatedSubscription.customer === 'string') {
        try {
          await syncSubscriptionState(updatedSubscription.customer, updatedSubscription, event);
        } catch (error) {
          console.error(`Error updating user on ${event.type}:`, error);
        }
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      if (typeof deletedSubscription.customer === 'string') {
        try {
          const userDoc = await findUserByStripeCustomerId(deletedSubscription.customer);

          if (userDoc) {
            const existing = userDoc.data() as { lastStripeEventCreated?: number } | undefined;
            if (
              typeof existing?.lastStripeEventCreated === 'number' &&
              existing.lastStripeEventCreated > event.created
            ) {
              console.log(`[Stripe] Ignoring stale subscription.deleted ${event.id} for customer ${deletedSubscription.customer}`);
              break;
            }

            await userDoc.ref.set({
              plan: 'free',
              stripeCustomerId: deletedSubscription.customer,
              stripeSubscriptionId: deletedSubscription.id,
              stripeSubscriptionStatus: deletedSubscription.status ?? 'canceled',
              billingNeedsAttention: false,
              lastStripeEvent: event.type,
              lastStripeEventCreated: event.created,
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error updating user on customer.subscription.deleted:', error);
        }
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      if (typeof failedInvoice.customer === 'string') {
        try {
          const userDoc = await findUserByStripeCustomerId(failedInvoice.customer);

          if (userDoc) {
            await userDoc.ref.set({
              billingNeedsAttention: true,
              lastStripeEvent: event.type,
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error updating user on invoice.payment_failed:', error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
