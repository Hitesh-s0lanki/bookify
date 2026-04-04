"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface PlanCtaButtonProps {
  planId: "free" | "pro";
  cta: string;
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "lg";
}

export function PlanCtaButton({
  planId,
  cta,
  className,
  variant = "default",
  size = "default",
}: PlanCtaButtonProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro" | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let cancelled = false;

    fetch("/api/users/me")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch current plan.");
        }

        return response.json() as Promise<{ plan?: "free" | "pro" }>;
      })
      .then((data) => {
        if (!cancelled) {
          setCurrentPlan(data.plan ?? "free");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentPlan(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (planId === "free") {
    const href = isSignedIn ? "/library" : "/sign-up";
    const label = isSignedIn && currentPlan === "free" ? "Current Plan" : cta;

    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link href={href}>{label}</Link>
      </Button>
    );
  }

  if (isLoaded && isSignedIn && currentPlan === "pro") {
    return (
      <Button disabled variant={variant} size={size} className={className}>
        Current Plan
      </Button>
    );
  }

  const href =
    isLoaded && isSignedIn
      ? "/billing/checkout"
      : `/sign-in?redirect_url=${encodeURIComponent("/billing/checkout")}`;

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href}>{cta}</Link>
    </Button>
  );
}
