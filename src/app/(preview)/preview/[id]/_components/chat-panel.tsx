"use client";

import { MessageCircleMore } from "lucide-react";

import type { Book } from "@/types/book";

interface ChatPanelProps {
  book: Book;
  currentPage: number;
}

export function ChatPanel({ book, currentPage }: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircleMore className="size-6" />
      </div>
      <p className="text-sm font-semibold">Chat coming soon</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Chat support for &quot;{book.title}&quot; (page {currentPage}) will be available soon.
      </p>
    </div>
  );
}
