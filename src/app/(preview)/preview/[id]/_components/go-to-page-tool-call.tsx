"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";

interface GoToPageToolCallProps {
  page: number;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  onPageChange: (page: number) => void;
}

export function GoToPageToolCall({ page, state, onPageChange }: GoToPageToolCallProps) {
  const [navigated, setNavigated] = useState(false);

  function handleClick() {
    onPageChange(page);
    setNavigated(true);
  }

  if (state === "input-streaming") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Going to page {page}…
      </span>
    );
  }

  // state === "input-available" — tool is ready, no server result expected
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {navigated ? (
        <CheckCircle className="size-3 text-green-500" />
      ) : (
        <BookOpen className="size-3" />
      )}
      Page {page}
    </button>
  );
}
