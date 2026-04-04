import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getCheckoutReturnUrl,
  getOrCreateStripeCustomer,
  getProLineItem,
  getStripe,
  getStripePublishableKey,
} from "@/lib/stripe";
import { ensureUserRecord } from "@/modules/user/service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const { user } = await ensureUserRecord({ clerkId: userId, clerkUser });

    if (user.plan === "pro" && user.stripeSubscriptionStatus !== "canceled") {
      return NextResponse.json(
        { error: "You already have an active Pro plan.", alreadySubscribed: true },
        { status: 409 }
      );
    }

    const stripe = getStripe();
    const customer = await getOrCreateStripeCustomer({
      userId,
      email: user.email ?? "",
      name: user.name ?? "",
      stripeCustomerId: user.stripeCustomerId,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ui_mode: "elements",
      customer: customer.id,
      client_reference_id: userId,
      line_items: [getProLineItem()],
      return_url: getCheckoutReturnUrl(),
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      metadata: {
        clerkId: userId,
        plan: "pro",
      },
      subscription_data: {
        metadata: {
          clerkId: userId,
          plan: "pro",
        },
      },
    });

    if (!session.client_secret) {
      throw new Error("Stripe did not return a checkout client secret.");
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      publishableKey: getStripePublishableKey(),
      customerEmail: user.email,
    });
  } catch (error) {
    console.error("POST /api/billing/checkout-session", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to initialize checkout session.",
      },
      { status: 500 }
    );
  }
}
