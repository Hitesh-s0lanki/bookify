import { NonRetriableError } from "inngest";

import { inngest } from "./client";
import { connectToDatabase } from "@/lib/db";
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
        return Buffer.from(book.pdfBuffer).toString("base64");
      }

      const response = await fetch(pdfUrl);
      if (!response.ok)
        throw new Error(`Failed to download PDF: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString("base64");
    });

    const text = await step.run("extract-text", async () => {
      const { PDFParse } = await import("pdf-parse");
      const buffer = Buffer.from(pdfBuffer, "base64");
      const parser = new PDFParse({ data: buffer });

      try {
        const parsed = await parser.getText();
        const extractedText = parsed.text;

        if (!extractedText || extractedText.trim().length === 0) {
          throw new NonRetriableError(
            "PDF text extraction returned empty content"
          );
        }

        return extractedText;
      } finally {
        await parser.destroy();
      }
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
      await connectToDatabase();
      await BookModel.updateOne({ _id: bookId }, { status: "FAILED" });
    });
  }
);
