export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth as adminAuth, db as adminDb } from "@/firebase/admin";
import { getAppOrigin } from "@/lib/app-origin";

export async function POST(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not defined in environment variables");
      return NextResponse.json({ error: "Payment service unavailable" }, { status: 500 });
    }

    const authorization = req.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const idToken = authorization.slice("Bearer ".length).trim();
    if (!idToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userSnapshot = await adminDb.collection("users").doc(decodedToken.uid).get();

    if (!userSnapshot.exists) {
      return NextResponse.json({ error: "Account record not found" }, { status: 404 });
    }

    const stripeCustomerId = userSnapshot.data()?.stripeCustomerId;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No active Stripe customer was found for this account yet." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const origin = getAppOrigin(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Billing Portal Error:", error);
    return NextResponse.json({ error: error.message || "Unable to open billing portal" }, { status: 500 });
  }
}
