"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SessionStatusResponse = {
  id: string;
  status: "open" | "complete" | "expired";
  paymentStatus: string;
  customerEmail?: string;
  amountTotal?: number | null;
  currency?: string | null;
  subscriptionStatus?: string | null;
  accessGranted: boolean;
};

function formatMoney(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number" || !currency) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState<SessionStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">(
    sessionId ? "loading" : "idle"
  );

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let cancelled = false;

    fetch(`/api/billing/session-status?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | (SessionStatusResponse & { error?: string })
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to verify payment status.");
        }

        return payload as SessionStatusResponse;
      })
      .then((payload) => {
        if (!cancelled) {
          setSession(payload);
        }
      })
      .catch((statusError) => {
        if (!cancelled) {
          setError(
            statusError instanceof Error
              ? statusError.message
              : "Failed to verify payment status."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatus("ready");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const amountLabel = useMemo(
    () => formatMoney(session?.amountTotal, session?.currency),
    [session?.amountTotal, session?.currency]
  );

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Alert variant="destructive">
          <AlertTitle>Missing payment reference</AlertTitle>
          <AlertDescription>Open this page from a completed checkout redirect.</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-3">
          <Button asChild>
            <Link href="/billing/checkout">Go to checkout</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">Back to pricing</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Verifying your payment...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Alert variant="destructive">
          <AlertTitle>We couldn&apos;t verify this payment</AlertTitle>
          <AlertDescription>{error ?? "Payment session details are unavailable."}</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-3">
          <Button asChild>
            <Link href="/billing/checkout">Try checkout again</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">Back to pricing</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isComplete = session.status === "complete";
  const isPaid =
    session.paymentStatus === "paid" || session.paymentStatus === "no_payment_required";

  return (
    <div className="mx-auto max-w-3xl py-4">
      <Card className="overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
        <CardHeader className="border-b bg-linear-to-br from-primary/10 via-background to-background">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Badge className="rounded-full">
                {isComplete && isPaid ? "Payment Successful" : "Payment Status"}
              </Badge>
              <div>
                <CardTitle className="text-3xl">
                  {isComplete && isPaid ? "Welcome to Bookify Pro" : "Payment is still processing"}
                </CardTitle>
                <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                  {isComplete && isPaid
                    ? "Your Bookify account has been upgraded. You can head back into the app and start using Pro features right away."
                    : "We've received your checkout session, but the final payment confirmation is still pending. You can refresh this page in a moment."}
                </CardDescription>
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary">
              {isComplete && isPaid ? (
                <CheckCircle2 className="size-10" />
              ) : (
                <RefreshCcw className="size-10" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {isComplete && isPaid ? (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertTitle>Pro access is active</AlertTitle>
              <AlertDescription>
                Your subscription is now attached to your account and future upgrades or
                cancellations will stay synced through Stripe webhooks.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Waiting for final confirmation</AlertTitle>
              <AlertDescription>
                If you used a bank redirect or authentication step, Stripe may still be finalizing
                the subscription. This page will remain safe to revisit.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5 sm:grid-cols-2">
            <DetailItem label="Checkout session" value={session.id} mono />
            <DetailItem label="Payment status" value={session.paymentStatus} />
            <DetailItem label="Subscription status" value={session.subscriptionStatus ?? "pending"} />
            <DetailItem label="Amount" value={amountLabel ?? "Bookify Pro monthly"} />
            <DetailItem label="Customer email" value={session.customerEmail ?? "Not available"} />
            <DetailItem label="Plan" value="Bookify Pro" />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/library">
                Go to Library
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!isComplete || !isPaid ? (
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href={`/billing/success?session_id=${encodeURIComponent(session.id)}`}>
                  <RefreshCcw className="size-4" />
                  Refresh status
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/pricing">
                  <CreditCard className="size-4" />
                  View pricing
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "break-all font-mono text-sm" : "text-sm"}>{value}</p>
    </div>
  );
}
