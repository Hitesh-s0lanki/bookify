"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";

import type { Book } from "@/types/book";

interface ChatWelcomeProps {
  book: Book;
  onSuggest: (text: string) => void;
}

const FALLBACK_SUGGESTIONS = [
  "What is this book about?",
  "Who are the main characters or key figures?",
  "What are the central themes?",
  "Summarise the first chapter",
];

export function ChatWelcome({ book, onSuggest }: ChatWelcomeProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/books/${book.id}/suggestions`)
      .then((r) => r.json())
      .then((data: { suggestions?: string[] }) => {
        if (!cancelled) {
          setSuggestions(
            data.suggestions?.length ? data.suggestions : FALLBACK_SUGGESTIONS,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions(FALLBACK_SUGGESTIONS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [book.id]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Hero section */}
      <div className="flex flex-col items-center gap-4 px-5 pt-8 pb-6 text-center">
        {/* Book cover or icon */}
        {book.coverUrl ? (
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl" />
            <Image
              src={book.coverUrl}
              alt={book.title}
              width={80}
              height={112}
              className="relative h-28 w-20 rounded-xl object-cover shadow-lg ring-1 ring-border"
            />
          </div>
        ) : (
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <BookOpen className="size-7 text-primary" />
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            AI Reading Assistant
          </p>
          <h2 className="text-sm font-semibold leading-snug text-foreground">
            {book.title}
          </h2>
          {book.author && (
            <p className="text-xs text-muted-foreground">by {book.author}</p>
          )}
        </div>

        <p className="max-w-[320px] text-xs leading-relaxed text-muted-foreground">
          Ask me anything — plot, characters, themes, quotes, or navigate to any
          page.
        </p>
      </div>

      {/* Suggestions */}
      <div className="flex flex-col gap-2 px-8 pb-6">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-9 animate-pulse rounded-xl bg-muted/60"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </>
        ) : (
          suggestions.map((text) => (
            <button
              key={text}
              onClick={() => onSuggest(text)}
              className="group relative flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-left text-xs text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground cursor-pointer"
            >
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/40 transition-colors group-hover:bg-primary" />
              {text}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
