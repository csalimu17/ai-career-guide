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
      return NextResponse.json({ error: 'Payment service unavailable' }, { status: 500 });
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

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
    }

    const selectedPlan = getBillingPlan(planId);
    if (!selectedPlan?.stripePriceId) {
      return NextResponse.json({ error: 'Invalid paid plan selected' }, { status: 400 });
    }

    const origin = getAppOrigin(req);

    const session = await stripe.checkout.sessions.create({
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

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    if (typeof err?.message === 'string' && /no such price/i.test(err.message)) {
      return NextResponse.json(
        {
          error: 'Billing for this plan is temporarily unavailable. Please try again in a moment or contact support.',
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
