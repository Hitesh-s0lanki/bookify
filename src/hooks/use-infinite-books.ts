"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { Book } from "@/types/book";

const PAGE_SIZE = 12;

export function useInfiniteBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipRef = useRef(0);
  const fetchingRef = useRef(false);

  const fetchPage = useCallback(async (skip: number, isInitial: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/books?limit=${PAGE_SIZE}&skip=${skip}`);
      if (!res.ok) throw new Error("Failed to load books");
      const data: Book[] = await res.json();

      setBooks((prev) => (isInitial ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      skipRef.current = skip + data.length;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error("Could not load library");
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPage(0, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!fetchingRef.current && hasMore) {
      fetchPage(skipRef.current, false);
    }
  }, [hasMore, fetchPage]);

  return { books, loading, loadingMore, hasMore, error, loadMore };
}
