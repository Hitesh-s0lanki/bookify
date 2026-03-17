"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

const PDFViewerInner = dynamic(
  () => import("./pdf-viewer-inner").then((m) => ({ default: m.PDFViewerInner })),
  { ssr: false }
);

interface PDFViewerProps {
  file: string;
  className?: string;
}

export function PDFViewer({ file, className }: PDFViewerProps) {
  return <PDFViewerInner file={file} className={cn(className)} />;
}
