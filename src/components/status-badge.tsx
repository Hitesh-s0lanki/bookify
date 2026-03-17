"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BookStatus } from "@/types/book";

interface StatusBadgeProps {
  status: BookStatus;
  className?: string;
}

const labels: Record<BookStatus, string> = {
  pending: "Processing",
  ready: "Ready",
  UPLOADED: "Uploaded",
  PROCESSING: "Processing",
  READY: "Ready",
  FAILED: "Failed",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isProcessing = status === "pending" || status === "PROCESSING" || status === "UPLOADED";
  const isFailed = status === "FAILED";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        isFailed
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : isProcessing
            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        className
      )}
    >
      {isProcessing && <Loader2 className="size-3 animate-spin" />}
      {labels[status]}
    </span>
  );
}
