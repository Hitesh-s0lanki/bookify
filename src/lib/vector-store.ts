import { eq } from "drizzle-orm";

import { bookChunks } from "@/db/schema";
import { db } from "@/lib/neon-db";

const INSERT_BATCH_SIZE = 50;

export async function deleteChunksForBook(bookId: string) {
  await db.delete(bookChunks).where(eq(bookChunks.bookId, bookId));
}

export async function insertChunksWithEmbeddings({
  chunks,
  embeddings,
}: {
  chunks: { bookId: string; chunkText: string; page: number }[];
  embeddings: number[][];
}) {
  for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + INSERT_BATCH_SIZE);
    const batchEmbeddings = embeddings.slice(i, i + INSERT_BATCH_SIZE);

    await db.insert(bookChunks).values(
      batch.map((chunk, j) => ({
        bookId: chunk.bookId,
        chunkText: chunk.chunkText,
        page: chunk.page,
        embedding: batchEmbeddings[j],
      }))
    );
  }
}
