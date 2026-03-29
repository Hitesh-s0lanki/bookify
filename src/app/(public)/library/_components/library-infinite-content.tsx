"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

import { BookCard } from "@/app/(public)/_components/book-card";
import { BookGridSkeleton } from "@/app/(public)/_components/book-grid-skeleton";
import { LibraryEmptyState } from "@/app/(public)/_components/library-empty-state";
import { LibraryErrorState } from "@/app/(public)/_components/library-error-state";
import { useInfiniteBooks } from "@/hooks/use-infinite-books";

export function LibraryInfiniteContent() {
  const { books, loading, loadingMore, hasMore, error, loadMore } =
    useInfiniteBooks();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (loading) return <BookGridSkeleton count={12} />;
  if (error) return <LibraryErrorState message={error} />;
  if (books.length === 0) return <LibraryEmptyState />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {books.map((book, index) => (
          <div
            key={book.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${Math.min((index % 12) * 40, 280)}ms` }}
          >
            <BookCard book={book} />
          </div>
        ))}
      </div>

      {/* Sentinel — triggers next page fetch when it enters the viewport */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {/* Loading more spinner */}
      {loadingMore && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading more books…
        </div>
      )}

      {/* End of list */}
      {!hasMore && books.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          All {books.length} {books.length === 1 ? "book" : "books"} loaded
        </p>
      )}
    </div>
  );
}
