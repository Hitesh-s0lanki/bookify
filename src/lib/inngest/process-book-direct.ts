import { connectToDatabase } from "@/lib/db";
import { chunkTextByPages } from "@/lib/chunker";
import { generateEmbeddings } from "@/lib/api/embeddings";
import { generateGetPresignedUrl } from "@/lib/api/s3";
import {
  deleteChunksForBook,
  insertChunksWithEmbeddings,
} from "@/lib/vector-store";
import { BookModel } from "@/modules/books/model";

/**
 * Processes a book directly without Inngest.
 * Used in development for immediate feedback and easier debugging.
 */
export async function processBookDirect(payload: {
  bookId: string;
  pdfUrl: string;
}) {
  const { bookId, pdfUrl } = payload;

  try {
    // Step 1: Fetch book data
    await connectToDatabase();
    await BookModel.updateOne({ _id: bookId }, { status: "PROCESSING" });

    const book = await BookModel.findById(bookId)
      .select("+pdfBuffer")
      .lean();
    if (!book) throw new Error(`Book ${bookId} not found`);

    let pdfBase64: string;
    if (book.pdfBuffer) {
      // .lean() returns BSON Binary instead of Node.js Buffer — extract raw bytes
      const raw = book.pdfBuffer;
      const buf = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from((raw as { buffer: Uint8Array }).buffer ?? raw);
      pdfBase64 = buf.toString("base64");
    } else {
      // Generate a signed URL since the bucket isn't public
      const s3Key = extractS3Key(pdfUrl);
      const fetchUrl = s3Key
        ? await generateGetPresignedUrl({ key: s3Key })
        : pdfUrl;
      const response = await fetch(fetchUrl);
      if (!response.ok)
        throw new Error(`Failed to download PDF: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0)
        throw new Error(
          `PDF download returned 0 bytes. Check S3 bucket access.`
        );
      pdfBase64 = Buffer.from(arrayBuffer).toString("base64");
    }

    // Step 2: Extract text
    const buffer = Buffer.from(pdfBase64, "base64");
    if (buffer.length === 0) {
      throw new Error(
        "PDF is empty (0 bytes). Check that the file was uploaded correctly or that the PDF URL is accessible."
      );
    }

    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });

    let text: string;
    try {
      const parsed = await parser.getText();
      text = parsed.text;

      if (!text || text.trim().length === 0) {
        throw new Error("PDF text extraction returned empty content");
      }
    } finally {
      await parser.destroy();
    }

    // Step 3: Create chunks
    const chunks = chunkTextByPages({ text, bookId });

    if (chunks.length === 0) {
      throw new Error("No chunks generated from PDF");
    }

    // Step 4: Generate embeddings
    const embeddings = await generateEmbeddings(
      chunks.map((c) => c.chunkText)
    );

    // Step 5: Insert vectors
    await deleteChunksForBook(bookId);
    await insertChunksWithEmbeddings({ chunks, embeddings });

    // Step 6: Update status
    await connectToDatabase();
    const contextText = text.slice(0, 20_000);
    await BookModel.updateOne(
      { _id: bookId },
      { status: "READY", contextText }
    );

    return { bookId, chunksInserted: chunks.length };
  } catch (error) {
    // Log the full error for debugging, store a user-friendly message in the DB
    console.error(`[process-book] Book ${bookId} failed:`, error);
    const failureReason = toUserFriendlyError(error);
    try {
      await connectToDatabase();
      await BookModel.updateOne(
        { _id: bookId },
        { status: "FAILED", failureReason }
      );
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

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

/** Map raw errors to short, user-friendly messages */
function toUserFriendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : "";

  if (msg.includes("PDF is empty") || msg.includes("0 bytes"))
    return "The uploaded PDF appears to be empty or corrupted.";
  if (msg.includes("Failed to download PDF"))
    return "Could not download the PDF file. Please try re-uploading.";
  if (msg.includes("text extraction returned empty"))
    return "Could not extract any text from this PDF.";
  if (msg.includes("No chunks generated"))
    return "The PDF did not contain enough text to process.";

  // Everything else (DB errors, embedding errors, etc.) — keep it generic
  return "Internal server error. Please try again later.";
}
