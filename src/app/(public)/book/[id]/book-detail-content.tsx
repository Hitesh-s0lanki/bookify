"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

import { BookViewer } from "./_components/book-viewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Book } from "@/types/book";
import { GuestLimitModal } from "@/components/gates/GuestLimitModal";
import { UpgradeModal } from "@/components/gates/UpgradeModal";

const GUEST_BOOKS_KEY = "bookify_guest_books";
const GUEST_LIMIT = 2;
const FREE_LIMIT = 5;

interface BookDetailContentProps {
  params: Promise<{ id: string }>;
}

function BookDetailSkeleton() {
  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <div className="flex gap-4 sm:gap-6">
        <Skeleton className="aspect-[3/4] w-24 shrink-0 rounded-lg sm:w-40" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4 sm:h-8" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 hidden h-10 w-36 sm:block" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-10 w-full sm:hidden" />
    </div>
  );
}

export function BookDetailContent({ params }: BookDetailContentProps) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/books/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load book");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) setBook(data);
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

  const handleBookUpdate = useCallback((updated: Book) => {
    setBook(updated);
  }, []);

  const checkAccess = useCallback(async (): Promise<boolean> => {
    // Guest path
    if (!isSignedIn) {
      const raw = localStorage.getItem(GUEST_BOOKS_KEY);
      const guestBooks: string[] = raw ? JSON.parse(raw) : [];
      if (guestBooks.includes(id)) return true; // resuming
      if (guestBooks.length >= GUEST_LIMIT) {
        setShowGuestModal(true);
        return false;
      }
      localStorage.setItem(
        GUEST_BOOKS_KEY,
        JSON.stringify([...guestBooks, id])
      );
      return true;
    }

    // Authenticated path — check plan
    try {
      const [meRes, progressRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch(`/api/reading-progress?bookId=${id}`),
      ]);
      const me = await meRes.json();
      const existingProgress = await progressRes.json();

      if (me.plan === "pro") return true;

      // Free plan: allowed if book already has progress OR total count < 5
      if (existingProgress !== null) return true;

      const countRes = await fetch("/api/reading-progress?count=1");
      const { count } = await countRes.json();
      if (count < FREE_LIMIT) return true;

      setShowUpgradeModal(true);
      return false;
    } catch {
      // On error, allow access — don't block the reader
      return true;
    }
  }, [id, isSignedIn]);

  if (loading) return <BookDetailSkeleton />;
  if (notFound || !book) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground">Book not found.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <BookViewer book={book} onBookUpdate={handleBookUpdate} onCheckAccess={checkAccess} />
      <GuestLimitModal open={showGuestModal} onOpenChange={setShowGuestModal} />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
}
