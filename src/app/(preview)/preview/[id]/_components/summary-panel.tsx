"use client";

import ReactMarkdown from "react-markdown";

import type { Book } from "@/types/book";

interface SummaryPanelProps {
  book: Book;
}

export function SummaryPanel({ book }: SummaryPanelProps) {
  if (book.summary?.trim()) {
    return (
      <div className="h-full overflow-y-auto px-4 pb-5">
        <article className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{book.summary}</ReactMarkdown>
        </article>
      </div>
    );
  }

  if (book.status === "FAILED") {
    return (
      <div className="px-4 py-6 text-sm text-muted-foreground">
        A summary could not be prepared for this book because processing failed.
      </div>
    );
  }

  return (
    <div className="px-4 py-6 text-sm text-muted-foreground">
      {book.status === "ready"
        ? "The book is ready. Summary generation may still be finishing in the background."
        : "Bookify is preparing the summary for this book."}
    </div>
  );
}
