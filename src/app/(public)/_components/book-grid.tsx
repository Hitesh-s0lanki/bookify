"use client";

import { BookCard } from "./book-card";
import type { Book } from "@/types/book";

interface BookGridProps {
  books: Book[];
  className?: string;
}

export function BookGrid({ books, className }: BookGridProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${className ?? ""}`}
    >
      {books.map((book, index) => (
        <div
          key={book.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
        >
          <BookCard book={book} />
        </div>
      ))}
    </div>
  );
}
