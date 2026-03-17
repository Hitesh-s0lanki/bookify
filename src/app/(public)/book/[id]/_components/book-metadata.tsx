"use client";

import { BookOpen, User } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type { Book } from "@/types/book";

interface BookMetadataProps {
  book: Book;
  className?: string;
}

export function BookMetadata({ book, className }: BookMetadataProps) {
  const hasDescription = Boolean(book.description?.trim());
  const hasGenre = Boolean(book.genre?.trim());
  const hasTags = Array.isArray(book.tags) && book.tags.length > 0;

  return (
    <div className={className}>
      <div className="mb-4 flex items-start gap-3">
        <StatusBadge status={book.status} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="size-4 shrink-0" />
          <span className="text-sm font-medium">{book.author}</span>
        </div>

        {hasGenre && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground">Genre:</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
              {book.genre}
            </span>
          </div>
        )}

        {hasDescription && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Description
            </span>
            <p className="text-sm leading-relaxed">{book.description}</p>
          </div>
        )}

        {hasTags && (
          <div className="flex flex-wrap gap-1.5">
            {book.tags!.map((tag) => (
              <span
                key={tag}
                className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {book.voicePersona && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="size-3.5" />
            <span>Voice: {book.voicePersona}</span>
          </div>
        )}
      </div>
    </div>
  );
}
