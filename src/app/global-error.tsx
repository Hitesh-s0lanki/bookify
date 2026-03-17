"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4 font-sans text-[#1a1a1a] antialiased">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ffe4e6]">
            <AlertTriangle className="h-10 w-10 text-[#e11d48]" />
          </div>

          <h1
            className="text-7xl font-black tracking-tight sm:text-8xl"
            style={{
              background: "linear-gradient(to right, #e11d48, #f97316, #f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            500
          </h1>

          <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#737373] sm:text-base">
            A critical error occurred. Please try again.
          </p>

          {error.digest && (
            <p className="mt-3 rounded-lg bg-[#f5f5f4] px-3 py-1.5 font-mono text-xs text-[#737373]">
              Error ID: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
