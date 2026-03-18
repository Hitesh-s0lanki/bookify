"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { BookGrid } from "@/app/(public)/_components/book-grid";
import { BookGridSkeleton } from "@/app/(public)/_components/book-grid-skeleton";
import { LibraryErrorState } from "@/app/(public)/_components/library-error-state";
import { useLibraryBooks } from "@/hooks/use-library-books";

export function SearchResultsContent() {
  const searchParams = useSearchParams();
  const q = useMemo(() => searchParams.get("q")?.trim() ?? "", [searchParams]);
  const { books, loading, error } = useLibraryBooks({ query: q, toastOnError: false });

  if (!q) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">Type a book title or author in the navbar search.</p>
      </div>
    );
  }

  if (loading) return <BookGridSkeleton />;
  if (error) return <LibraryErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Search results</h1>
        <p className="text-sm text-muted-foreground">
          {books.length} {books.length === 1 ? "book" : "books"} for &ldquo;{q}&rdquo;
        </p>
      </div>
      {books.length > 0 ? (
        <BookGrid books={books} />
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No books found for &ldquo;{q}&rdquo;.</p>
        </div>
      )}
    </div>
  );
}
