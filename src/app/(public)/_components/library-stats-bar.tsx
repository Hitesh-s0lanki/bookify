import { BookOpen, Headphones } from "lucide-react";

import type { Book } from "@/types/book";

function voiceReadyCount(books: Book[]) {
  return books.filter(
    (b) => b.status === "ready" || b.status === "READY"
  ).length;
}

type Props = {
  books: Book[];
};

export function LibraryStatsBar({ books }: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="size-4 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold text-foreground">{books.length}</span>{" "}
        Books
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Headphones className="size-4 text-orange-600 dark:text-orange-400" />
        <span className="font-semibold text-foreground">
          {voiceReadyCount(books)}
        </span>{" "}
        Voice-ready
      </div>
    </div>
  );
}
