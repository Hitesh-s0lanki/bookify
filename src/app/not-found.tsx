import Link from "next/link";
import { BookX, Home, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-soft absolute -left-24 top-1/4 size-96 rounded-full bg-amber-200/20 blur-3xl dark:bg-amber-800/10" />
        <div className="animate-pulse-soft absolute -right-24 bottom-1/4 size-80 rounded-full bg-orange-200/20 blur-3xl delay-2 dark:bg-orange-800/10" />
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-amber-100/80 dark:bg-amber-900/20">
          <BookX className="size-10 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Error code */}
        <h1 className="animate-gradient-x bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
          404
        </h1>

        {/* Message */}
        <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
          Page not found
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="gap-2 rounded-full px-6">
            <Link href="/">
              <Home className="size-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-full px-6">
            <Link href="javascript:history.back()">
              <ArrowLeft className="size-4" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
