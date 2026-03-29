"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Loader2, Tag, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CoverUpload } from "@/app/(protected)/upload/_components/cover-upload";
import { PdfUpload } from "@/app/(protected)/upload/_components/pdf-upload";
import { MarkdownEditor } from "@/components/markdown-editor";
import { DEFAULT_BOOK_SUMMARY_REQUEST } from "@/modules/summary/default-request";

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

type MetadataState = {
  title: string;
  author: string;
  description: string;
  genre: string;
  tags: string[];
};

const emptyMetadata: MetadataState = {
  title: "",
  author: "",
  description: "",
  genre: "",
  tags: [],
};

function validatePdfFile(file: File | null) {
  if (!file) return null;
  if (file.type !== "application/pdf") return "Only PDF files are allowed.";
  if (file.size > MAX_PDF_SIZE_BYTES) return "PDF must be 50MB or smaller.";
  return null;
}

function validateCoverFile(file: File | null) {
  if (!file) return null;
  if (!ALLOWED_COVER_TYPES.has(file.type)) return "Cover must be JPG or PNG.";
  return null;
}

/** Section inside single card — divider only, no extra box border */
function FormSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`space-y-4 ${className}`}>{children}</section>;
}

export function MetadataForm() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<MetadataState>(emptyMetadata);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [extracted, setExtracted] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [summaryPrompt, setSummaryPrompt] = useState(
    DEFAULT_BOOK_SUMMARY_REQUEST,
  );
  const extractedRef = useRef(false);

  const pdfError = useMemo(() => validatePdfFile(pdfFile), [pdfFile]);
  const coverError = useMemo(() => validateCoverFile(coverFile), [coverFile]);

  const bothFilesReady = !!pdfFile && !!coverFile && !pdfError && !coverError;

  const extractMetadata = useCallback(async (pdf: File, cover: File) => {
    setError(null);
    setSuccess(null);
    setIsExtracting(true);
    setExtracted(false);
    setExtractionFailed(false);

    try {
      const formData = new FormData();
      formData.append("cover", cover);

      const response = await fetch("/api/books/extract-metadata", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to extract metadata.");
      }

      const data = (await response.json()) as {
        title: string;
        author: string;
        description: string;
        genre: string;
        tags: string[];
      };

      setMetadata({
        title: data.title ?? "",
        author: data.author ?? "",
        description: data.description ?? "",
        genre: data.genre ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
      setExtracted(true);
      extractedRef.current = true;
    } catch (extractError) {
      const message =
        extractError instanceof Error
          ? extractError.message
          : "Metadata extraction failed.";
      setError(message);
      setExtractionFailed(true);
      toast.error("Metadata extraction failed", { description: message });
    } finally {
      setIsExtracting(false);
    }
  }, []);

  // Auto-extract when both files are ready (once — no retry on failure)
  useEffect(() => {
    if (
      bothFilesReady &&
      pdfFile &&
      coverFile &&
      !extractedRef.current &&
      !isExtracting &&
      !extractionFailed
    ) {
      extractMetadata(pdfFile, coverFile);
    }
  }, [
    bothFilesReady,
    pdfFile,
    coverFile,
    isExtracting,
    extractionFailed,
    extractMetadata,
  ]);

  // Reset extraction state when files change
  const handlePdfChange = useCallback((file: File | null) => {
    setPdfFile(file);
    setExtracted(false);
    setExtractionFailed(false);
    extractedRef.current = false;
    setMetadata(emptyMetadata);
    setError(null);
    setSuccess(null);
  }, []);

  const handleCoverChange = useCallback((file: File | null) => {
    setCoverFile(file);
    setExtracted(false);
    setExtractionFailed(false);
    extractedRef.current = false;
    setMetadata(emptyMetadata);
    setError(null);
    setSuccess(null);
  }, []);

  const onUploadBook = async () => {
    setError(null);
    setSuccess(null);

    if (!pdfFile || !coverFile) {
      setError("Please upload both a PDF and cover image.");
      return;
    }

    if (!metadata.title.trim() || !metadata.author.trim()) {
      setError("Metadata extraction is required before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", metadata.title.trim());
      formData.append("author", metadata.author.trim());
      formData.append("description", metadata.description.trim());
      formData.append("genre", metadata.genre.trim());
      formData.append("tags", JSON.stringify(metadata.tags));
      formData.append("summaryPrompt", summaryPrompt.trim());
      formData.append("pdf", pdfFile);
      formData.append("cover", coverFile);

      const response = await fetch("/api/books/create", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to upload book.");
      }

      const result = (await response.json()) as {
        bookId?: string;
        status?: string;
      };
      const bookId = result.bookId;

      toast.success("Book uploaded — processing started.");
      if (bookId) {
        setSuccess("Book uploaded successfully!");
        setTimeout(() => router.push(`/book/${bookId}`), 800);
      } else {
        setSuccess("Book uploaded successfully!");
      }
      setMetadata(emptyMetadata);
      setPdfFile(null);
      setCoverFile(null);
      setExtracted(false);
      extractedRef.current = false;
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload book.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const isBusy = isExtracting || isUploading;
  const hasMetadata = extracted && metadata.title;

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-1 gap-5 p-3 sm:p-5 md:grid-cols-3">
        {/* Step 2 — Extraction */}
        <FormSection className="order-2 h-full md:order-1 md:col-span-2">
          {isExtracting && (
            <div className="flex items-center gap-4 rounded-xl bg-primary/10 px-4 py-4 dark:bg-primary/15 h-full ">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/50 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary ring-2 ring-primary/30" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Analyzing your book with AI…
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Extracting title, author, description, genre & tags
                </p>
              </div>
              <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
            </div>
          )}

          {hasMetadata && !isExtracting && (
            <div className="space-y-4 rounded-xl bg-muted/60 shadow p-4 py-6 dark:bg-muted/20">
              <BookOpen className="mt-1 size-6 shrink-0 text-muted-foreground" />
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-lg">{metadata.title}</p>
                    <p className="text-xs">- {metadata.author}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {metadata.genre && (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Genre -
                      </p>
                      <span className=" inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                        {metadata.genre}
                      </span>
                    </div>
                  )}

                  {metadata.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tags -
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {metadata.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                          >
                            <Tag className="size-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {extractionFailed && !isExtracting && (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-destructive/10 px-4 py-6 text-center dark:bg-destructive/15">
              <p className="text-sm font-medium text-destructive">
                Metadata extraction failed. Please try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!bothFilesReady}
                onClick={() => {
                  if (pdfFile && coverFile) {
                    setExtractionFailed(false);
                    setError(null);
                    extractMetadata(pdfFile, coverFile);
                  }
                }}
              >
                <Wand2 className="size-3.5" />
                Retry extraction
              </Button>
            </div>
          )}

          {!bothFilesReady &&
            !hasMetadata &&
            !isExtracting &&
            !extractionFailed && (
              <div className="rounded-xl h-full bg-muted/30  px-8 py-8 text-center dark:bg-muted/15 flex justify-center items-center flex-col border shadow">
                <p className="text-lg font-medium text-muted-foreground">
                  Upload both files above to automatically extract metadata
                </p>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  PDF + JPG/PNG — extraction starts as soon as both are set
                </p>
              </div>
            )}
        </FormSection>

        {/* Step 1 — File Uploads */}
        <FormSection className="order-1 md:order-2">
          <PdfUpload
            file={pdfFile}
            onFileChange={handlePdfChange}
            error={pdfError}
            disabled={isBusy}
          />
          <CoverUpload
            file={coverFile}
            onFileChange={handleCoverChange}
            error={coverError}
            disabled={isBusy}
          />
        </FormSection>

        <FormSection className="order-3 md:col-span-3">
          <MarkdownEditor
            value={summaryPrompt}
            onChange={(val) => setSummaryPrompt(val)}
            placeholder="How should Bookify summarize this book?"
            disabled={isBusy}
            label="Summary Instructions"
          />
        </FormSection>
      </div>

      {/* Step 3 — Upload */}
      <FormSection className="flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="text-sm text-muted-foreground/80">
          Providing a good summary can help you get useful results from Bookify
          faster!
        </span>
        <Button
          onClick={onUploadBook}
          disabled={!hasMetadata || isBusy}
          className="w-full gap-2 sm:w-auto"
        >
          {isUploading && <Loader2 className="size-5 animate-spin" />}
          {isUploading ? "Uploading…" : "Upload book"}
        </Button>
      </FormSection>

      {/* Status Messages */}
      {error && (
        <div className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{success}</span>
            <span className="text-xs opacity-80">Opening your book…</span>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <Link href="/">Go to Library</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
