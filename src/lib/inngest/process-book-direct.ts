import { connectToDatabase } from "@/lib/db";
import { chunkTextByPages } from "@/lib/chunker";
import { generateEmbeddings } from "@/lib/api/embeddings";
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
      pdfBase64 = Buffer.from(book.pdfBuffer).toString("base64");
    } else {
      const response = await fetch(pdfUrl);
      if (!response.ok)
        throw new Error(`Failed to download PDF: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0)
        throw new Error(
          `PDF download returned 0 bytes from ${pdfUrl}. Check S3 bucket access and CORS.`
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
    // Mark book as failed on any error
    try {
      await connectToDatabase();
      await BookModel.updateOne({ _id: bookId }, { status: "FAILED" });
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
