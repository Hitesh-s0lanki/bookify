"use client";

import { BookGrid } from "@/app/(public)/_components/book-grid";
import { BookGridSkeleton } from "@/app/(public)/_components/book-grid-skeleton";
import { LibraryErrorState } from "@/app/(public)/_components/library-error-state";
import { useLibraryBooks } from "@/hooks/use-library-books";

export function MyLibraryContent() {
  const { books, loading, error } = useLibraryBooks({ includeAllStatuses: true });

  if (loading) return <BookGridSkeleton />;
  if (error) return <LibraryErrorState message={error} />;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Library</h1>
        <p className="text-sm text-muted-foreground">
          View all uploaded books including ready, processing, and failed statuses.
        </p>
      </div>

      {books.length > 0 ? (
        <BookGrid books={books} />
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No uploaded books found yet.</p>
        </div>
      )}
    </section>
  );
}
