export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth as adminAuth } from '@/firebase/admin';
import { getAppOrigin } from '@/lib/app-origin';
import { getPlan as getBillingPlan } from '@/lib/plans';

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY is not defined in environment variables');
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not configured in server environment variables.' }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const idToken = authorization.slice('Bearer '.length).trim();
    if (!idToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authErr: any) {
      console.error('Firebase token verification error:', authErr);
      return NextResponse.json({ error: 'Authentication token expired or invalid. Please re-login and try again.' }, { status: 401 });
    }

    // SECURITY: Block checkout for anonymous guest users without email.
    if (decodedToken.firebase.sign_in_provider === 'anonymous' || !decodedToken.email) {
      return NextResponse.json(
        {
          error: 'You are currently using a guest account. Please sign up or log in to subscribe to a paid plan.',
          code: 'ANONYMOUS_USER',
        },
        { status: 403 }
      );
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
    }

    const selectedPlan = getBillingPlan(String(planId).toLowerCase());
    if (!selectedPlan || selectedPlan.id === "free") {
      return NextResponse.json({ error: 'Invalid paid plan selected' }, { status: 400 });
    }

    const origin = getAppOrigin(req);
    const amountInPence = selectedPlan.id === 'pro' ? 699 : selectedPlan.id === 'master' ? 1099 : 0;

    let session: Stripe.Checkout.Session;
    try {
      if (!selectedPlan.stripePriceId) throw new Error("No static stripePriceId configured");
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: selectedPlan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/settings`,
        customer_email: decodedToken.email,
        client_reference_id: decodedToken.uid,
        metadata: {
          userId: decodedToken.uid,
          plan: selectedPlan.id,
          origin,
        },
      });
    } catch (priceErr: any) {
      console.warn("Primary Stripe price ID failed or inactive, creating session with inline price_data:", priceErr?.message);
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `AI Career Guide ${selectedPlan.name} Plan`,
                description: `Monthly subscription for ${selectedPlan.name} Tier`,
              },
              unit_amount: amountInPence,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/settings`,
        customer_email: decodedToken.email,
        client_reference_id: decodedToken.uid,
        metadata: {
          userId: decodedToken.uid,
          plan: selectedPlan.id,
          origin,
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    const errorMessage = typeof err?.message === 'string' ? err.message : '';
    if (/no such price/i.test(errorMessage)) {
      return NextResponse.json(
        {
          error: 'The Stripe price ID for this plan was not found in your Stripe account. Please check your Stripe Dashboard.',
        },
        { status: 500 }
      );
    }
    if (/api_key/i.test(errorMessage) || /apiKey/i.test(errorMessage)) {
      return NextResponse.json(
        {
          error: 'Stripe Secret Key is invalid. Please verify STRIPE_SECRET_KEY in your environment configuration.',
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: errorMessage || 'We could not start the checkout session. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
