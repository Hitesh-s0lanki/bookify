"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerInnerProps {
  file: string;
  className?: string;
}

export function PDFViewerInner({ file, className }: PDFViewerInnerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [fullWidth, setFullWidth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoading(false);
    setError("Failed to load PDF");
    toast.error("Could not load the PDF. The file may be missing or invalid.");
  }, []);

  const goPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goNext = () =>
    setPageNumber((p) => Math.min(numPages ?? 1, p + 1));
  const zoomIn = () => setScale((s) => Math.min(2.5, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.2));

  if (error) {
    return (
      <div
        className={cn(
          "flex min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center",
          className
        )}
      >
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goPrev}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[80px] text-center text-sm tabular-nums">
            {pageNumber} / {numPages ?? "—"}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goNext}
            disabled={!numPages || pageNumber >= numPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            aria-label="Zoom out"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
            disabled={scale >= 2.5}
            aria-label="Zoom in"
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setFullWidth((w) => !w)}
          aria-label="Toggle full width"
        >
          <Maximize2 className="size-4" />
          {fullWidth ? "Normal" : "Full width"}
        </Button>
      </div>

      <div className="flex justify-center overflow-auto bg-muted/20 p-4">
        {loading && (
          <div className="flex min-h-[480px] items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className={cn(loading && "hidden")}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            width={fullWidth ? 1000 : 600}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-md transition-transform"
          />
        </Document>
      </div>
    </div>
  );
}
