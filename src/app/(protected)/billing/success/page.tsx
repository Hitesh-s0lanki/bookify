import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { BillingSuccessPage } from "./_components/billing-success-page";

export const metadata: Metadata = {
  title: "Payment Success - Bookify",
  description: "Bookify payment confirmation and subscription status.",
};

export default async function BillingSuccessRoute() {
  await auth.protect();

  return <BillingSuccessPage />;
}
