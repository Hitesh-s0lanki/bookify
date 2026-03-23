import { NonRetriableError } from "inngest";

import { inngest } from "./client";
import { connectToDatabase } from "@/lib/db";
import { generateGetPresignedUrl } from "@/lib/api/s3";
import { extractRawTextFromPdfBuffer } from "@/lib/pdf";
import { BookModel } from "@/modules/books/model";

export const processBook = inngest.createFunction(
  {
    id: "process-book",
    retries: 3,
  },
  { event: "book.uploaded" },
  async ({ event, step }) => {
    const { bookId, pdfUrl } = event.data as {
      bookId: string;
      pdfUrl: string;
    };

    const pdfBuffer = await step.run("fetch-book-data", async () => {
      await connectToDatabase();
      await BookModel.updateOne({ _id: bookId }, { status: "PROCESSING" });

      const book = await BookModel.findById(bookId)
        .select("+pdfBuffer")
        .lean();
      if (!book) throw new NonRetriableError(`Book ${bookId} not found`);

      if (book.pdfBuffer) {
        // .lean() returns BSON Binary instead of Node.js Buffer — extract raw bytes
        const raw = book.pdfBuffer;
        const buf = Buffer.isBuffer(raw)
          ? raw
          : Buffer.from((raw as { buffer: Uint8Array }).buffer ?? raw);
        return buf.toString("base64");
      }

      // Generate a signed URL since the bucket isn't public
      const s3Key = extractS3Key(pdfUrl);
      const fetchUrl = s3Key
        ? await generateGetPresignedUrl({ key: s3Key })
        : pdfUrl;
      const response = await fetch(fetchUrl);
      if (!response.ok)
        throw new Error(`Failed to download PDF: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString("base64");
    });

    const text = await step.run("extract-text", async () => {
      const buffer = Buffer.from(pdfBuffer, "base64");
      const extractedText = await extractRawTextFromPdfBuffer(buffer);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new NonRetriableError(
          "PDF text extraction returned empty content"
        );
      }

      return extractedText;
    });

    const chunks = await step.run("create-chunks", async () => {
      const { chunkTextByPages } = await import("@/lib/chunker");
      return chunkTextByPages({ text, bookId });
    });

    if (chunks.length === 0) {
      throw new NonRetriableError("No chunks generated from PDF");
    }

    const embeddings = await step.run("generate-embeddings", async () => {
      const { generateEmbeddings } = await import("@/lib/api/embeddings");
      return generateEmbeddings(chunks.map((c) => c.chunkText));
    });

    await step.run("insert-vectors", async () => {
      const { deleteChunksForBook, insertChunksWithEmbeddings } = await import(
        "@/lib/vector-store"
      );
      await deleteChunksForBook(bookId);
      await insertChunksWithEmbeddings({ chunks, embeddings });
    });

    await step.run("update-status", async () => {
      await connectToDatabase();
      const contextText = text.slice(0, 20_000);
      await BookModel.updateOne(
        { _id: bookId },
        { status: "READY", contextText }
      );
    });

    return { bookId, chunksInserted: chunks.length };
  }
);

export const handleBookFailure = inngest.createFunction(
  { id: "handle-book-failure" },
  { event: "inngest/function.failed" },
  async ({ event, step }) => {
    const originalEvent = event.data.event;
    if (originalEvent.name !== "book.uploaded") return;

    const bookId = originalEvent.data?.bookId as string | undefined;
    if (!bookId) return;

    await step.run("set-failed-status", async () => {
      const rawMessage =
        (event.data.error?.message as string) || "";
      console.error(`[process-book] Book ${bookId} failed:`, rawMessage);
      // Store a user-friendly message, not raw internals
      const failureReason = rawMessage.includes("PDF is empty") || rawMessage.includes("0 bytes")
        ? "The uploaded PDF appears to be empty or corrupted."
        : rawMessage.includes("Failed to download PDF")
          ? "Could not download the PDF file. Please try re-uploading."
          : rawMessage.includes("text extraction returned empty")
            ? "Could not extract any text from this PDF."
            : rawMessage.includes("No chunks generated")
              ? "The PDF did not contain enough text to process."
              : "Internal server error. Please try again later.";
      await connectToDatabase();
      await BookModel.updateOne(
        { _id: bookId },
        { status: "FAILED", failureReason }
      );
    });
  }
);

function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("amazonaws.com")) {
      return decodeURIComponent(parsed.pathname.slice(1));
    }
  } catch {
    // Not a valid URL
  }
  return null;
}
