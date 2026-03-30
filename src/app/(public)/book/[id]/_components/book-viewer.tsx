"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Book } from "@/types/book";

import { BookMetadata } from "./book-metadata";
import { EditMetadataDialog } from "./edit-metadata-dialog";

const FALLBACK_COVER = "/file.svg";
const POLL_INTERVAL = 5000;

interface BookViewerProps {
  book: Book;
  onBookUpdate?: (book: Book) => void;
  onCheckAccess?: () => Promise<boolean>;
}

export function BookViewer({
  book: initialBook,
  onBookUpdate,
  onCheckAccess,
}: BookViewerProps) {
  const router = useRouter();
  const [book, setBook] = useState(initialBook);
  const [coverSrc, setCoverSrc] = useState(book.coverUrl || FALLBACK_COVER);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isReady = book.status === "ready";
  const isFailed = book.status === "FAILED";
  const isProcessing =
    book.status === "pending" ||
    book.status === "PROCESSING" ||
    book.status === "UPLOADED";
  const canShowPdf =
    isReady && book.pdfUrl && !book.pdfUrl.startsWith("pending");

  const fetchBook = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${book.id}`);
      if (!res.ok) return;
      const updated: Book = await res.json();
      setBook(updated);
      if (updated.coverUrl) setCoverSrc(updated.coverUrl);
      onBookUpdate?.(updated);
    } catch {
      // Silently fail polling
    }
  }, [book.id, onBookUpdate]);

  useEffect(() => {
    if (isProcessing) {
      pollRef.current = setInterval(fetchBook, POLL_INTERVAL);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isProcessing, fetchBook]);

  const handleReprocess = async () => {
    setIsReprocessing(true);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reprocess");
      }
      setBook((prev) => ({
        ...prev,
        status: "PROCESSING",
        failureReason: undefined,
      }));
      toast.success("Reprocessing started");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reprocess",
      );
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete book");
      }
      toast.success("Book deleted successfully");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete book",
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleMetadataUpdated = () => {
    fetchBook();
  };

  return (
    <div>
      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          {/* Mobile: column layout. Desktop: row layout */}
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6">

            {/* Cover — centered on mobile, left-aligned on desktop */}
            <div className="flex justify-center sm:block sm:shrink-0">
              <div className="relative aspect-[3/4] w-36 overflow-hidden rounded-xl bg-muted shadow-md sm:w-44">
                <Image
                  src={coverSrc}
                  alt={`${book.title} cover`}
                  fill
                  className="object-contain p-1"
                  sizes="(max-width: 640px) 144px, 176px"
                  unoptimized
                  onError={() => setCoverSrc(FALLBACK_COVER)}
                />
              </div>
            </div>

            {/* Title, author, metadata, actions */}
            <div className="min-w-0 flex-1">

              {/* Title row with action menu */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {book.title}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {book.author}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                    >
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Book actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
                      <Pencil className="mr-2 size-4" />
                      Edit metadata
                    </DropdownMenuItem>
                    {canShowPdf && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={book.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 size-4" />
                          Open PDF
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isFailed && (
                      <DropdownMenuItem
                        onSelect={handleReprocess}
                        disabled={isReprocessing}
                      >
                        <RefreshCw className="mr-2 size-4" />
                        Reprocess
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete book
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <BookMetadata book={book} />

              {/* Status / CTA — same layout on all screen sizes */}
              {(isProcessing || isFailed || isReady) && (
                <div className="space-y-2">
                  {isProcessing && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
                      <Loader2 className="size-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Processing your book…
                      </p>
                    </div>
                  )}
                  {isFailed && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                      <AlertTriangle className="size-4 shrink-0 text-destructive" />
                      <p className="text-sm text-destructive">
                        Processing failed
                        {book.failureReason ? ` — ${book.failureReason}` : ""}
                      </p>
                    </div>
                  )}
                  {isReady && (
                    <Button
                      className="w-full gap-2 rounded-full sm:w-auto"
                      onClick={async () => {
                        const allowed = onCheckAccess ? await onCheckAccess() : true;
                        if (allowed) window.location.href = `/preview/${book.id}`;
                      }}
                    >
                      <Eye className="size-4" />
                      Preview & Chat
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit metadata dialog */}
      <EditMetadataDialog
        book={book}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdated={handleMetadataUpdated}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{book.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this book and all its data including
              AI-generated chunks and embeddings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
