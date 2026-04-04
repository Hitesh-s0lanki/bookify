"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckoutElementsProvider,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";

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
import { Separator } from "@/components/ui/separator";

type CheckoutSessionPayload = {
  clientSecret: string;
  sessionId: string;
  publishableKey: string;
  customerEmail?: string;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const perks = [
  "Unlimited e-books and reading history",
  "Unlimited AI chat and voice conversations",
  "Priority processing for new uploads",
  "Deep analysis, summaries, and exports",
];

const stripePromiseCache = new Map<string, ReturnType<typeof loadStripe>>();

function getStripePromise(publishableKey: string) {
  const existing = stripePromiseCache.get(publishableKey);
  if (existing) {
    return existing;
  }

  const stripePromise = loadStripe(publishableKey);
  stripePromiseCache.set(publishableKey, stripePromise);
  return stripePromise;
}

function CheckoutForm() {
  const router = useRouter();
  const checkoutState = useCheckout();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (checkoutState.type === "loading") {
    return (
      <div className="flex min-h-56 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Checkout failed to load</AlertTitle>
        <AlertDescription>{checkoutState.error.message}</AlertDescription>
      </Alert>
    );
  }

  const { checkout } = checkoutState;
  const amountCents = checkout.total?.total?.amount;
  const planTotal = amountCents != null
    ? `${money.format(Number(amountCents) / 100)} / month`
    : "$9.00 / month";
  const lastPaymentError = checkout.lastPaymentError?.message ?? null;

  const finishCheckout = async (
    expressCheckoutConfirmEvent?: StripeExpressCheckoutElementConfirmEvent
  ) => {
    setSubmitting(true);
    setError(null);

    const result = await checkout.confirm({
      redirect: "if_required",
      returnUrl: `${window.location.origin}/billing/success?session_id=${checkout.id}`,
      expressCheckoutConfirmEvent,
    });

    setSubmitting(false);

    if (result.type === "error") {
      setError(result.error.message);
      return;
    }

    router.push(`/billing/success?session_id=${result.session.id}`);
  };

  const handleSubmit = async () => {
    await finishCheckout();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden border-primary/15 shadow-lg shadow-primary/5">
        <CardHeader className="border-b bg-linear-to-r from-primary/8 via-background to-background">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge className="mb-3 rounded-full">Secure Checkout</Badge>
              <CardTitle className="text-2xl">Upgrade to Bookify Pro</CardTitle>
              <CardDescription className="mt-2 max-w-xl text-sm leading-6">
                Complete your payment on Bookify with Stripe&apos;s secure Payment Element. Your
                subscription starts immediately after the payment succeeds.
              </CardDescription>
            </div>
            <div className="hidden rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary lg:block">
              <CreditCard className="size-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bookify Pro</p>
                <p className="text-xl font-semibold">{planTotal}</p>
              </div>
              <Badge variant="secondary" className="rounded-full">
                Renews monthly
              </Badge>
            </div>

            <ExpressCheckoutElement
              onConfirm={finishCheckout}
              options={{
                buttonHeight: 44,
                buttonTheme: {},
                buttonType: {},
                layout: {
                  maxColumns: 2,
                  maxRows: 1,
                  overflow: "auto",
                },
                paymentMethodOrder: [],
                paymentMethods: {},
              }}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Payment details</h2>
              <p className="text-sm text-muted-foreground">
                Card, Link, and any other methods enabled in your Stripe Dashboard appear here.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background p-4 shadow-xs">
              <PaymentElement
                options={{
                  layout: "tabs",
                  wallets: {
                    applePay: "auto",
                    googlePay: "auto",
                  },
                }}
              />
            </div>
          </div>

          {(error || lastPaymentError) && (
            <Alert variant="destructive">
              <AlertTitle>Payment could not be completed</AlertTitle>
              <AlertDescription>{error ?? lastPaymentError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleSubmit}
              disabled={submitting || !checkout.canConfirm}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {submitting ? "Processing..." : `Pay ${planTotal}`}
            </Button>
            <Button asChild size="lg" variant="ghost" className="gap-2">
              <Link href="/pricing">
                <ArrowLeft className="size-4" />
                Back to pricing
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-4 text-primary" />
              What you unlock
            </CardTitle>
            <CardDescription>Everything in Free, plus the complete Pro toolkit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">{perk}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="size-4 text-primary" />
              Billing notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You&apos;ll be charged {planTotal} and the plan will renew monthly until canceled.</p>
            <p>
              After a successful payment, Bookify upgrades your account automatically and sends
              you to a verified success page.
            </p>
            <p>Your card details are collected securely by Stripe and never touch Bookify&apos;s servers.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function StripeCheckoutPage() {
  const [session, setSession] = useState<CheckoutSessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/billing/checkout-session", {
      method: "POST",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | (CheckoutSessionPayload & { error?: string })
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to create Stripe checkout session.");
        }

        return payload as CheckoutSessionPayload;
      })
      .then((payload) => {
        if (!cancelled) {
          setSession(payload);
        }
      })
      .catch((checkoutError) => {
        if (!cancelled) {
          setError(
            checkoutError instanceof Error
              ? checkoutError.message
              : "Failed to load payment page."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stripePromise = session?.publishableKey
    ? getStripePromise(session.publishableKey)
    : null;

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Preparing your secure checkout...</span>
        </div>
      </div>
    );
  }

  if (error || !session || !stripePromise) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Alert variant="destructive">
          <AlertTitle>Unable to open checkout</AlertTitle>
          <AlertDescription>{error ?? "Stripe checkout could not be initialized."}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/pricing">Return to pricing</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{
        clientSecret: session.clientSecret,
        elementsOptions: {
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#0f766e",
              colorBackground: "#ffffff",
              colorText: "#0f172a",
              colorDanger: "#dc2626",
              borderRadius: "16px",
              spacingUnit: "4px",
            },
          },
          loader: "auto",
        },
      }}
    >
      <CheckoutForm />
    </CheckoutElementsProvider>
  );
}
