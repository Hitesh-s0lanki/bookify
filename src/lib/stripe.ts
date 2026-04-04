import Stripe from "stripe";

import { UserModel } from "@/modules/user/model";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_BOOKIFY_PRO_PRICE_ID;

export const BOOKIFY_PRO_PLAN = {
  id: "pro",
  name: "Bookify Pro",
  amount: 900,
  currency: "usd",
  interval: "month" as const,
  description: "Unlimited books, AI chat, voice conversations, and priority processing.",
};

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function getStripePublishableKey() {
  if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured.");
  }

  return STRIPE_PUBLISHABLE_KEY;
}

export function getStripeWebhookSecret() {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return STRIPE_WEBHOOK_SECRET;
}

export function getBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!configured) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return configured.startsWith("http") ? configured : `https://${configured}`;
}

export function getCheckoutReturnUrl() {
  return `${getBaseUrl()}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
}

export function getProLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  if (STRIPE_PRO_PRICE_ID) {
    return {
      price: STRIPE_PRO_PRICE_ID,
      quantity: 1,
    };
  }

  return {
    quantity: 1,
    price_data: {
      currency: BOOKIFY_PRO_PLAN.currency,
      unit_amount: BOOKIFY_PRO_PLAN.amount,
      recurring: {
        interval: BOOKIFY_PRO_PLAN.interval,
      },
      product_data: {
        name: BOOKIFY_PRO_PLAN.name,
        description: BOOKIFY_PRO_PLAN.description,
      },
    },
  };
}

export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name: string;
  stripeCustomerId?: string | null;
}) {
  const stripe = getStripe();
  const { userId, email, name, stripeCustomerId } = params;

  if (stripeCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(stripeCustomerId);
      if (!("deleted" in existingCustomer) || existingCustomer.deleted !== true) {
        if (email || name) {
          await stripe.customers.update(existingCustomer.id, {
            email: email || undefined,
            name: name || undefined,
          });
        }
        return existingCustomer;
      }
    } catch (err) {
      const stripeErr = err as { code?: string };
      if (stripeErr?.code !== "resource_missing") throw err;
      // Customer was hard-deleted in Stripe — fall through to create a new one
    }
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: {
      clerkId: userId,
    },
  });

  await UserModel.updateOne(
    { clerkId: userId },
    {
      $set: {
        stripeCustomerId: customer.id,
      },
    }
  );

  return customer;
}

function userPlanFromSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
      return "pro";
    default:
      return "free";
  }
}

async function findUserForStripeObject(params: {
  customerId?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  clerkId?: string | null;
}) {
  const customerId =
    typeof params.customerId === "string" ? params.customerId : params.customerId?.id;

  if (customerId) {
    const user = await UserModel.findOne({ stripeCustomerId: customerId });
    if (user) {
      return user;
    }
  }

  if (params.clerkId) {
    return UserModel.findOne({ clerkId: params.clerkId });
  }

  return null;
}

export async function syncStripeSubscriptionToUser(
  subscriptionOrId: string | Stripe.Subscription
) {
  const stripe = getStripe();
  const subscription =
    typeof subscriptionOrId === "string"
      ? await stripe.subscriptions.retrieve(subscriptionOrId)
      : subscriptionOrId;

  const user = await findUserForStripeObject({
    customerId: subscription.customer,
    clerkId: subscription.metadata?.clerkId ?? null,
  });

  if (!user) {
    return null;
  }

  user.plan = userPlanFromSubscriptionStatus(subscription.status);
  user.stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? user.stripeCustomerId;
  user.stripeSubscriptionId = subscription.id;
  user.stripeSubscriptionStatus = subscription.status;
  await user.save();

  return user;
}

export async function syncCheckoutSessionToUser(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") {
    return null;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (subscriptionId) {
    return syncStripeSubscriptionToUser(subscriptionId);
  }

  if (
    session.status === "complete" &&
    (session.payment_status === "paid" || session.payment_status === "no_payment_required")
  ) {
    const user = await findUserForStripeObject({
      customerId: session.customer,
      clerkId: session.metadata?.clerkId ?? null,
    });

    if (!user) {
      return null;
    }

    user.plan = "pro";
    user.stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? user.stripeCustomerId;
    await user.save();

    return user;
  }

  return null;
}
