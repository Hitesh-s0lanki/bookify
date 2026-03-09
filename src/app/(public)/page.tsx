import Link from "next/link";

import { BookCard } from "@/components/books/book-card";
import { MOCK_BOOKS } from "@/constants/mock-books";

export default function Home() {
  const books = MOCK_BOOKS;

  if (books.length === 0) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">No books found</h1>
        <p className="text-muted-foreground">
          Add your first book to start building your library.
        </p>
        <Link
          href="/books/new"
          className="font-medium text-primary underline underline-offset-4"
        >
          Go to Add New
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Your Library</h1>
        <p className="text-muted-foreground">
          Continue where you left off or start a new conversation.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </section>
    </div>
  );
}
