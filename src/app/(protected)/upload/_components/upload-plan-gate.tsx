"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Zap, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FREE_PLAN_BOOK_LIMIT } from "@/lib/constants";

interface UploadPlanGateProps {
  children: React.ReactNode;
}

export function UploadPlanGate({ children }: UploadPlanGateProps) {
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/users/me")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json() as Promise<{ plan?: string; bookCount?: number }>;
      })
      .then((data) => {
        if (cancelled) return;
        const isPro = data.plan === "pro";
        const bookCount = data.bookCount ?? 0;
        setStatus(isPro || bookCount < FREE_PLAN_BOOK_LIMIT ? "allowed" : "blocked");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Zap className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            You&apos;ve reached your 2-book limit
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Free plan allows up to {FREE_PLAN_BOOK_LIMIT} books. Upgrade to Pro for unlimited
            books, unlimited AI chat, and priority processing.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="gap-2 rounded-full px-6 shadow-md shadow-primary/20">
            <Link href="/billing/checkout">
              <Zap className="size-4" />
              Upgrade to Pro
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href="/">Back to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          Could not verify your plan. Please refresh the page to try again.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
