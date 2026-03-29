"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { BookMarked, ArrowRight, LogIn } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";

interface RecentProgressItem {
  bookId: string;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    status: string;
  };
}

const FALLBACK_COVER = "/file.svg";

export function ContinueReadingSection() {
  const { isSignedIn, isLoaded } = useAuth();

  // Not loaded yet — render nothing to avoid layout shift
  if (!isLoaded) return null;

  // Guest nudge
  if (!isSignedIn) {
    return (
      <section className="pb-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
          <BookMarked className="size-4 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            Sign up to track your reading progress across devices.
          </p>
          <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full text-xs">
            <Link href="/sign-up">
              <LogIn className="size-3.5" />
              Sign Up
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return <SignedInContinueReadingSection />;
}

function SignedInContinueReadingSection() {
  const [items, setItems] = useState<RecentProgressItem[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/reading-progress/recent", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: RecentProgressItem[]) => setItems(data))
      .catch(() => setItems([]));

    return () => controller.abort();
  }, []);

  // Signed in but no progress yet
  if (items === null || items.length === 0) return null;

  return (
    <section className="pb-2">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
          <BookMarked className="size-3.5 text-primary" />
        </div>
        <h2 className="text-base font-bold tracking-tight">Continue Reading</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <ContinueReadingCard key={item.bookId} item={item} />
        ))}
      </div>
    </section>
  );
}

function ContinueReadingCard({ item }: { item: RecentProgressItem }) {
  const [coverSrc, setCoverSrc] = useState(item.book.coverUrl || FALLBACK_COVER);
  const progress =
    item.totalPages > 0
      ? Math.round((item.currentPage / item.totalPages) * 100)
      : 0;

  const timeAgo = formatDistanceToNow(new Date(item.lastReadAt), {
    addSuffix: true,
  });

  return (
    <Link
      href={`/preview/${item.book.id}`}
      className="group flex w-36 shrink-0 flex-col gap-2 rounded-xl border border-border/40 bg-card p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-44"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted/60">
        <Image
          src={coverSrc}
          alt={item.book.title}
          fill
          className="object-contain p-1"
          sizes="176px"
          onError={() => setCoverSrc(FALLBACK_COVER)}
        />
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <p className="line-clamp-1 text-xs font-semibold">{item.book.title}</p>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {item.book.author}
        </p>

        {/* Progress bar */}
        <div className="space-y-0.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {item.totalPages > 0
              ? `p. ${item.currentPage} of ${item.totalPages}`
              : `p. ${item.currentPage}`}
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
      </div>

      {/* Continue button */}
      <div className="mt-auto flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Continue
        <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}
