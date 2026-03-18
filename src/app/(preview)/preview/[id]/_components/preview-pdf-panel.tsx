"use client";

import dynamic from "next/dynamic";

const PreviewPdfInner = dynamic(
  () => import("./preview-pdf-inner").then((m) => ({ default: m.PreviewPdfInner })),
  { ssr: false }
);

interface PreviewPdfPanelProps {
  bookId: string;
  currentPage: number;
  onPageChange?: (page: number) => void;
  onNumPagesChange?: (numPages: number) => void;
}

export function PreviewPdfPanel({
  bookId,
  currentPage,
  onPageChange,
  onNumPagesChange,
}: PreviewPdfPanelProps) {
  return (
    <PreviewPdfInner
      bookId={bookId}
      currentPage={currentPage}
      onPageChange={onPageChange}
      onNumPagesChange={onNumPagesChange}
    />
  );
}
