import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  X,
  Zap,
  BookOpen,
  MessageCircle,
  Headphones,
  Brain,
  Sparkles,
  ArrowRight,
  Shield,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing — Bookify",
  description: "Simple, transparent pricing for every reader.",
};

/* ─── Plan definitions ─────────────────────────────────────── */

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for casual readers getting started.",
    cta: "Get Started Free",
    href: "/sign-up",
    highlight: false,
    badge: null,
    features: [
      "Up to 5 e-books",
      "10 AI chat messages per book",
      "3 voice summaries per month",
      "Basic PDF support",
      "Standard processing speed",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For avid readers who want the full AI experience.",
    cta: "Upgrade to Pro",
    href: "/sign-up",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited e-books",
      "Unlimited AI chat",
      "Unlimited voice conversations",
      "Advanced PDF support",
      "Priority processing speed",
      "Deep AI insights & analysis",
      "Export summaries as PDF",
    ],
  },
] as const;

/* ─── Comparison table rows ─────────────────────────────────── */

const COMPARE_ROWS: {
  icon: React.ComponentType<{ className?: string }>;
  feature: string;
  free: string | boolean;
  pro: string | boolean;
}[] = [
  { icon: BookOpen, feature: "E-book library", free: "Up to 5 books", pro: "Unlimited" },
  { icon: MessageCircle, feature: "AI chat messages", free: "10 / book", pro: "Unlimited" },
  { icon: Headphones, feature: "Voice summaries", free: "3 / month", pro: "Unlimited" },
  { icon: Brain, feature: "Deep AI insights", free: false, pro: true },
  { icon: Sparkles, feature: "Chapter analysis", free: false, pro: true },
  { icon: Zap, feature: "Priority processing", free: false, pro: true },
  { icon: Shield, feature: "Export summaries", free: false, pro: true },
];

/* ─── FAQ ────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Can I upgrade from Free to Pro anytime?",
    a: "Yes, you can upgrade at any time. Your existing books and chat history are preserved.",
  },
  {
    q: "What counts as an e-book?",
    a: "Any PDF you upload to your library counts as one e-book slot on the Free plan.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan gives you a taste of all features. Pro unlocks the full experience.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Absolutely. Cancel any time — no hidden fees, no contracts.",
  },
];

/* ─── Page ───────────────────────────────────────────────────── */

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16 py-4">

      {/* Header */}
      <header className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Simple Pricing
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Choose your plan
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Start free. Upgrade when you&apos;re ready for unlimited access.
        </p>
      </header>

      {/* Plan cards */}
      <section
        aria-label="Pricing plans"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </section>

      {/* Feature comparison table */}
      <section aria-label="Feature comparison">
        <h2 className="mb-5 text-center text-base font-bold tracking-tight">
          Compare plans
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border/60">
          {/* Table header */}
          <div className="grid grid-cols-3 border-b border-border/60 bg-muted/40 px-4 py-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Feature
            </span>
            <span className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Free
            </span>
            <span className="text-center text-xs font-bold text-primary uppercase tracking-wide">
              Pro
            </span>
          </div>

          {/* Table rows */}
          {COMPARE_ROWS.map((row, i) => {
            const Icon = row.icon;
            return (
              <div
                key={row.feature}
                className={cn(
                  "grid grid-cols-3 items-center px-4 py-3.5 transition-colors duration-150",
                  i % 2 === 0 ? "bg-background" : "bg-muted/20",
                  "hover:bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{row.feature}</span>
                </div>
                <div className="flex justify-center">
                  <CellValue value={row.free} />
                </div>
                <div className="flex justify-center">
                  <CellValue value={row.pro} isPro />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="Frequently asked questions">
        <h2 className="mb-6 text-center text-base font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-border/60 bg-card px-5 py-4 open:pb-4 transition-all duration-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold select-none">
                {faq.q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="rounded-2xl border border-primary/15 bg-linear-to-br from-primary/8 via-background to-primary/5 px-6 py-10 text-center dark:from-primary/12 dark:via-background dark:to-primary/8">
        <div className="animate-pulse-soft pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl" />
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Start reading smarter today
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          No credit card required. Free plan available forever.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="gap-2 rounded-full px-6 shadow-lg shadow-primary/20"
          >
            <Link href="/sign-up">
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="rounded-full px-5">
            <Link href="/upload">Try Uploading a Book</Link>
          </Button>
        </div>
      </section>

    </div>
  );
}

/* ─── Plan card ─────────────────────────────────────────────── */

function PlanCard({
  plan,
}: {
  plan: (typeof PLANS)[number];
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all duration-200",
        plan.highlight
          ? "border-primary/40 bg-linear-to-b from-primary/8 to-primary/4 shadow-xl shadow-primary/10 dark:from-primary/12 dark:to-primary/6"
          : "border-border/60 bg-card hover:border-border hover:shadow-md"
      )}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-md shadow-primary/30">
            {plan.badge}
          </Badge>
        </div>
      )}

      {/* Plan name + price */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {plan.name}
        </p>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight">
            {plan.price}
          </span>
          <span className="mb-1 text-sm text-muted-foreground">
            {plan.period}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </div>

      {/* Divider */}
      <div className="my-5 h-px bg-border/60" />

      {/* Features */}
      <ul className="flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full",
                plan.highlight
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        asChild
        size="lg"
        variant={plan.highlight ? "default" : "outline"}
        className={cn(
          "mt-6 w-full rounded-full",
          plan.highlight && "shadow-md shadow-primary/20"
        )}
      >
        <Link href={plan.href}>{plan.cta}</Link>
      </Button>
    </div>
  );
}

/* ─── Table cell value ──────────────────────────────────────── */

function CellValue({
  value,
  isPro = false,
}: {
  value: string | boolean;
  isPro?: boolean;
}) {
  if (value === true) {
    return (
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full",
          isPro ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-muted/50">
        <X className="size-3 text-muted-foreground/60" strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-xs font-medium",
        isPro ? "text-primary" : "text-muted-foreground"
      )}
    >
      {value}
    </span>
  );
}
