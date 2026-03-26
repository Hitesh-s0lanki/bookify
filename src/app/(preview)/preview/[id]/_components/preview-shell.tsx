"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Book } from "@/types/book";

import { PreviewPdfPanel } from "./preview-pdf-panel";
import { SidePanel } from "./side-panel";

interface PreviewShellProps {
  book: Book;
}

export function PreviewShell({ book }: PreviewShellProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Thin top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card/80 px-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href={`/book/${book.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <span className="max-w-[140px] truncate text-sm font-semibold sm:max-w-[400px]">
              {book.title}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              by {book.author}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            Page {currentPage}
            {numPages ? ` of ${numPages}` : ""}
          </span>

          {/* Mobile chat/voice sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8 md:hidden"
              >
                <MessageCircle className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 rounded-t-2xl p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Chat & Voice</SheetTitle>
              </SheetHeader>
              <div className="mx-auto my-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
              <div className="flex-1 overflow-hidden">
                <SidePanel book={book} currentPage={currentPage} numPages={numPages} onPageChange={setCurrentPage} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main layout */}
      <div className="grid flex-1 overflow-hidden md:grid-cols-2">
        {/* PDF panel — full width on mobile */}
        <div className="overflow-hidden md:border-r">
          <PreviewPdfPanel
            bookId={book.id}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onNumPagesChange={setNumPages}
          />
        </div>

        {/* Side panel — desktop only */}
        <div className="hidden overflow-hidden md:block">
          <SidePanel book={book} currentPage={currentPage} numPages={numPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}
