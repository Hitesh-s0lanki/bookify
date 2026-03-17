import { inngest } from "./client";
import { processBookDirect } from "./process-book-direct";

const isProduction = process.env.NODE_ENV === "production";

export async function triggerBookUploadedEvent(payload: {
  bookId: string;
  pdfUrl: string;
}) {
  if (isProduction) {
    // Production: send event to Inngest for durable, retryable execution
    await inngest.send({
      name: "book.uploaded",
      data: payload,
    });
  } else {
    // Development: process directly for faster feedback and easier debugging
    console.log(`[dev] Processing book ${payload.bookId} directly...`);
    processBookDirect(payload)
      .then((result) => {
        console.log(
          `[dev] Book ${payload.bookId} processed: ${result.chunksInserted} chunks`
        );
      })
      .catch((error) => {
        console.error(`[dev] Book ${payload.bookId} processing failed:`, error);
      });
  }
}
