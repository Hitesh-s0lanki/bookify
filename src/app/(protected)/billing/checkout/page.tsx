import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { StripeCheckoutPage } from "./_components/stripe-checkout-page";

export const metadata: Metadata = {
  title: "Checkout - Bookify",
  description: "Upgrade to Bookify Pro with a secure custom payment page.",
};

export default async function BillingCheckoutPage() {
  await auth.protect();

  return <StripeCheckoutPage />;
}
