"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Book } from "@/types/book";

import { BookMetadata } from "./book-metadata";
import { PDFViewer } from "./pdf-viewer";

const FALLBACK_COVER = "/file.svg";

interface BookViewerProps {
  book: Book;
}

export function BookViewer({ book }: BookViewerProps) {
  const [coverSrc, setCoverSrc] = useState(book.coverUrl || FALLBACK_COVER);
  const [showPdf, setShowPdf] = useState(false);
  const isReady = book.status === "ready";
  const isProcessing = book.status === "pending";
  const canShowPdf = isReady && book.pdfUrl && !book.pdfUrl.startsWith("pending");

  const handleAskAi = () => {
    toast.info("Ask AI — coming soon");
  };

  return (
    <div className="space-y-8">
      {/* Header card: cover + metadata */}
      <Card>
        <CardHeader className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative aspect-3/4 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-48">
            <Image
              src={coverSrc}
              alt={`${book.title} cover`}
              fill
              className="object-cover"
              sizes="12rem"
              onError={() => setCoverSrc(FALLBACK_COVER)}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <CardTitle className="text-2xl tracking-tight">{book.title}</CardTitle>
              <p className="mt-1 text-muted-foreground">{book.author}</p>
            </div>
            <BookMetadata book={book} />
          </div>
        </CardHeader>
      </Card>

      {/* Status-based actions */}
      {isProcessing && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="size-5 animate-spin text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium">Book is processing</p>
              <p className="text-sm text-muted-foreground">
                Reading and Ask AI will be available when processing is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isReady && (
        <div className="flex flex-wrap gap-3">
          {canShowPdf && (
            <Button
              className="gap-2"
              onClick={() => setShowPdf((v) => !v)}
            >
              <BookOpen className="size-4" />
              {showPdf ? "Hide reader" : "Read book"}
            </Button>
          )}
          <Button variant="secondary" className="gap-2" onClick={handleAskAi}>
            <MessageCircle className="size-4" />
            Ask AI
          </Button>
        </div>
      )}

      {/* PDF viewer */}
      {showPdf && canShowPdf && (
        <div className="animate-fade-in-up">
          <PDFViewer file={book.pdfUrl} className="rounded-xl border bg-card overflow-hidden" />
        </div>
      )}

      {/* Placeholder: Book management (future) */}
      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center gap-2 py-4 text-sm text-muted-foreground">
          <Sparkles className="size-4" />
          <span>When you’re the uploader: Edit metadata, Delete book, Reprocess — coming soon.</span>
        </CardContent>
      </Card>
    </div>
  );
}
