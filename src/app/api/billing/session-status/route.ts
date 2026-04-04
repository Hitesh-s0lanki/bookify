import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { getStripe, syncCheckoutSessionToUser } from "@/lib/stripe";
import { ensureUserRecord } from "@/modules/user/service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
    }

    const { user } = await ensureUserRecord({ clerkId: userId });
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const sessionCustomerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    const authorized =
      session.client_reference_id === userId ||
      session.metadata?.clerkId === userId ||
      (!!sessionCustomerId && sessionCustomerId === user.stripeCustomerId);

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const syncedUser = await syncCheckoutSessionToUser(session);

    const subscription =
      typeof session.subscription === "string" ? null : session.subscription;

    return NextResponse.json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email ?? user.email,
      amountTotal: session.amount_total,
      currency: session.currency,
      subscriptionStatus:
        subscription?.status ??
        syncedUser?.stripeSubscriptionStatus ??
        user.stripeSubscriptionStatus ??
        null,
      plan: syncedUser?.plan ?? user.plan ?? "free",
      accessGranted:
        session.status === "complete" &&
        (session.payment_status === "paid" || session.payment_status === "no_payment_required") &&
        (syncedUser?.plan === "pro" || user.plan === "pro"),
    });
  } catch (error) {
    console.error("GET /api/billing/session-status", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch payment session status.",
      },
      { status: 500 }
    );
  }
}
