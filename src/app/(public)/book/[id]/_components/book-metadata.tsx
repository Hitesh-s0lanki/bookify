"use client";

import { CalendarDays, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/book";

interface BookMetadataProps {
  book: Book;
  className?: string;
}

export function BookMetadata({ book, className }: BookMetadataProps) {
  const hasDescription = Boolean(book.description?.trim());
  const hasGenre = Boolean(book.genre?.trim());
  const hasTags = Array.isArray(book.tags) && book.tags.length > 0;
  const createdAtLabel = new Date(book.createdAt).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  return (
    <div className={cn("space-y-4 py-4", className)}>
      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 ">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Uploaded
          </p>
          <p className="inline-flex items-center gap-2 text-xs font-medium">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            {createdAtLabel}
          </p>
        </div>

        {hasDescription && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {book.description}
            </p>
          </div>
        )}

        {(hasGenre || hasTags) && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Classification
            </p>
            <div className="flex flex-wrap gap-2">
              {hasGenre && (
                <Badge variant="secondary" className="px-2.5 py-1 text-xs">
                  <FileText className="size-3.5" />
                  {book.genre}
                </Badge>
              )}
              {hasTags &&
                book.tags!.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-2.5 py-1 text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
