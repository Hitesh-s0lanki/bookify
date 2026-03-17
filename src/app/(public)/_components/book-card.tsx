"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";

import { StatusBadge } from "@/components/status-badge";
import type { Book } from "@/types/book";

const FALLBACK_COVER = "/file.svg";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const [coverSrc, setCoverSrc] = useState(book.coverUrl || FALLBACK_COVER);
  const uploadDate = book.createdAt ? format(new Date(book.createdAt), "MMM d, yyyy") : null;

  return (
    <Link
      href={`/book/${book.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <Image
          src={coverSrc}
          alt={`${book.title} cover`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
          onError={() => setCoverSrc(FALLBACK_COVER)}
        />
        <div className="absolute right-2 top-2">
          <StatusBadge status={book.status} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
        {uploadDate && (
          <p className="text-xs text-muted-foreground">{uploadDate}</p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 group-hover:w-full" />
    </Link>
  );
}
