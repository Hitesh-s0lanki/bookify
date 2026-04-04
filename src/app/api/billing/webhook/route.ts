import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  getStripe,
  getStripeWebhookSecret,
  syncCheckoutSessionToUser,
  syncStripeSubscriptionToUser,
} from "@/lib/stripe";

export const runtime = "nodejs";

async function handleInvoiceEvent(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;

  if (subscriptionId) {
    await syncStripeSubscriptionToUser(subscriptionId);
  }
}

export async function POST(request: Request) {
  try {
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const payload = await request.text();
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret()
    );

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await syncCheckoutSessionToUser(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.resumed":
        await syncStripeSubscriptionToUser(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await handleInvoiceEvent(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("POST /api/billing/webhook", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Stripe webhook failed.",
      },
      { status: 400 }
    );
  }
}
