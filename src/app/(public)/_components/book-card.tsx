"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { ArrowUpRight, CalendarDays, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Book } from "@/types/book";

const FALLBACK_COVER = "/file.svg";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const [coverSrc, setCoverSrc] = useState(book.coverUrl || FALLBACK_COVER);
  const uploadDate = book.createdAt
    ? format(new Date(book.createdAt), "MMM d, yyyy")
    : null;
  const hasGenre = Boolean(book.genre?.trim());
  const hasTags = Array.isArray(book.tags) && book.tags.length > 0;

  return (
    <Link
      href={`/book/${book.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-border/40 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-xl"
    >
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-amber-100/40 to-transparent dark:from-amber-900/20" />

      {/* Cover image */}
      <div className="relative m-2 aspect-[3/4] w-auto overflow-hidden rounded-md bg-muted/60 sm:m-3 sm:rounded-lg">
        <Image
          src={coverSrc}
          alt={`${book.title} cover`}
          fill
          className="object-contain p-1 transition-transform duration-500 group-hover:scale-[1.02] sm:p-1.5"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
          onError={() => setCoverSrc(FALLBACK_COVER)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-2 sm:gap-3 sm:px-4 sm:pb-4">
        <h3 className="line-clamp-1 text-sm font-semibold leading-snug tracking-tight sm:line-clamp-2 sm:text-base">
          {book.title}
        </h3>

        <div className="space-y-1 sm:space-y-1.5">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground sm:gap-1.5 sm:text-sm">
            <UserRound className="size-3 shrink-0 sm:size-3.5" />
            <span className="line-clamp-1">{book.author}</span>
          </p>
          {uploadDate && (
            <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <CalendarDays className="size-3.5 shrink-0" />
              {uploadDate}
            </p>
          )}
        </div>

        {(hasGenre || hasTags) && (
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {hasGenre && (
              <Badge variant="secondary" className="px-2 py-0.5 text-[11px]">
                {book.genre}
              </Badge>
            )}
            {hasTags &&
              book.tags!.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="px-2 py-0.5 text-[11px]"
                >
                  {tag}
                </Badge>
              ))}
          </div>
        )}

        <div className="mt-auto hidden items-center justify-between border-t pt-3 sm:flex">
          <span className="text-xs font-medium text-muted-foreground">
            View details
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
        </div>
      </div>
    </Link>
  );
}
