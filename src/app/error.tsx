"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-soft absolute -left-24 top-1/4 size-96 rounded-full bg-rose-200/20 blur-3xl dark:bg-rose-800/10" />
        <div className="animate-pulse-soft absolute -right-24 bottom-1/4 size-80 rounded-full bg-orange-200/20 blur-3xl delay-2 dark:bg-orange-800/10" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-rose-100/80 dark:bg-rose-900/20">
          <AlertTriangle className="size-10 text-rose-600 dark:text-rose-400" />
        </div>

        {/* Error code */}
        <h1 className="animate-gradient-x bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
          500
        </h1>

        {/* Message */}
        <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          An unexpected error occurred. Don&apos;t worry, you can try again or
          head back home.
        </p>

        {/* Error details */}
        {error.digest && (
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-1.5 font-mono text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2 rounded-full px-6">
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-full px-6">
            <Link href="/">
              <Home className="size-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
