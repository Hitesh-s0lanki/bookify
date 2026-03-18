"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PreviewPdfInnerProps {
  bookId: string;
  currentPage: number;
  onPageChange?: (page: number) => void;
  onNumPagesChange?: (numPages: number) => void;
}

export function PreviewPdfInner({
  bookId,
  currentPage,
  onPageChange,
  onNumPagesChange,
}: PreviewPdfInnerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const file = `/api/books/${bookId}/pdf`;

  // Measure container width and update on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Page width: fit container with some padding, cap at 600 on large screens
  const pageWidth = containerWidth
    ? Math.min(containerWidth - 32, 600)
    : undefined;

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      setError(null);
      onNumPagesChange?.(numPages);
    },
    [onNumPagesChange]
  );

  const onDocumentLoadError = useCallback(() => {
    setLoading(false);
    setError("Failed to load PDF");
  }, []);

  const goToPrev = useCallback(() => {
    if (currentPage > 1) onPageChange?.(currentPage - 1);
  }, [currentPage, onPageChange]);

  const goToNext = useCallback(() => {
    if (numPages && currentPage < numPages) onPageChange?.(currentPage + 1);
  }, [currentPage, numPages, onPageChange]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Bottom toolbar — page nav + zoom */}
      {!loading && numPages && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border bg-card/90 p-1 shadow-lg backdrop-blur-sm sm:gap-2">
          {/* Page navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 sm:size-8"
            onClick={goToPrev}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground sm:min-w-16">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 sm:size-8"
            onClick={goToNext}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="mx-0.5 h-5 w-px bg-border sm:mx-1" />

          {/* Zoom controls */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-8 text-center text-xs tabular-nums text-muted-foreground sm:min-w-10">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            disabled={scale >= 2.5}
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
      )}

      {/* Single page view */}
      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center overflow-auto bg-muted/30"
      >
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {pageWidth && (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className={cn("flex items-center justify-center", loading && "hidden")}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              width={pageWidth}
              renderTextLayer
              renderAnnotationLayer
              className="shadow-md"
            />
          </Document>
        )}
      </div>
    </div>
  );
}
