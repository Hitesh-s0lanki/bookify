"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BookGrid } from "./book-grid";
import { BookGridSkeleton } from "./book-grid-skeleton";
import { LibraryEmptyState } from "./library-empty-state";
import { LibraryErrorState } from "./library-error-state";
import { useLibraryBooks } from "@/hooks/use-library-books";

interface LibraryContentProps {
  limit?: number;
}

export function LibraryContent({ limit }: LibraryContentProps) {
  const { books, loading, error } = useLibraryBooks({ limit });

  if (loading) return <BookGridSkeleton count={limit ?? 8} />;
  if (error) return <LibraryErrorState message={error} />;
  if (books.length === 0) return <LibraryEmptyState />;

  return (
    <div className="space-y-5">
      <BookGrid books={books} />
      {limit && books.length >= limit && (
        <div className="flex justify-center">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            View all books
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
