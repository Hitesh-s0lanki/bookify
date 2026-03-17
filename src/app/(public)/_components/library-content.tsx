"use client";

import { BookGrid } from "./book-grid";

import { BookGridSkeleton } from "./book-grid-skeleton";
import { LibraryEmptyState } from "./library-empty-state";
import { LibraryErrorState } from "./library-error-state";
import { LibraryStatsBar } from "./library-stats-bar";
import { useLibraryBooks } from "@/hooks/use-library-books";

export function LibraryContent() {
  const { books, loading, error } = useLibraryBooks();

  if (loading) {
    return <BookGridSkeleton />;
  }

  if (error) {
    return <LibraryErrorState message={error} />;
  }

  if (books.length === 0) {
    return <LibraryEmptyState />;
  }

  return (
    <>
      <LibraryStatsBar books={books} />
      <BookGrid books={books} />
    </>
  );
}
