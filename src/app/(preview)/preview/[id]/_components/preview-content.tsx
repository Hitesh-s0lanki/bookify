"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

import type { Book } from "@/types/book";
import { PreviewShell } from "./preview-shell";

const GUEST_PROGRESS_KEY = "bookify_guest_progress";

interface GuestProgress {
  [bookId: string]: { page: number; title: string; coverUrl: string };
}

interface PreviewContentProps {
  params: Promise<{ id: string }>;
}

export function PreviewContent({ params }: PreviewContentProps) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialPage, setInitialPage] = useState(1);

  // Load book data
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load book");
        return res.json();
      })
      .then((data: Book) => {
        if (!cancelled) setBook(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load book");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load saved reading progress
  useEffect(() => {
    if (isSignedIn === undefined) return; // Clerk not loaded yet

    if (isSignedIn) {
      fetch(`/api/reading-progress?bookId=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.currentPage === "number" && data.currentPage > 1) {
            setInitialPage(data.currentPage);
          }
        })
        .catch(() => {
          // Silently fail — start from page 1
        });
    } else {
      // Guest: read from localStorage
      Promise.resolve().then(() => {
        try {
          const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
          const guestProgress: GuestProgress = raw ? JSON.parse(raw) : {};
          const saved = guestProgress[id];
          if (saved && saved.page > 1) {
            setInitialPage(saved.page);
          }
        } catch {
          // Silently fail
        }
      });
    }
  }, [id, isSignedIn]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Book not found.</p>
      </div>
    );
  }

  return (
    <PreviewShell
      book={book}
      initialPage={initialPage}
      isSignedIn={isSignedIn ?? false}
    />
  );
}
