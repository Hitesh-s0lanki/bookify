"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Book } from "@/types/book";

interface UseLibraryBooksOptions {
  query?: string;
  toastOnError?: boolean;
  includeAllStatuses?: boolean;
}

export function useLibraryBooks(options: UseLibraryBooksOptions = {}) {
  const { query, toastOnError = true, includeAllStatuses = false } = options;
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (query?.trim()) params.set("q", query.trim());
    if (includeAllStatuses) params.set("all", "1");
    const url = params.size > 0 ? `/api/books?${params.toString()}` : "/api/books";

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load books");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setBooks(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          if (toastOnError) toast.error("Could not load library");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, toastOnError, includeAllStatuses]);

  return { books, loading, error };
}
