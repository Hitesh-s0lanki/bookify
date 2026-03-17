"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { Book } from "@/types/book";

export function useLibraryBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/books")
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
          toast.error("Could not load library");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { books, loading, error };
}
