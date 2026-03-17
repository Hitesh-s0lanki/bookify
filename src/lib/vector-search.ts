import { sql } from "drizzle-orm";

import { db } from "@/lib/neon-db";

export type RetrievedChunk = {
  chunkText: string;
  page: number;
};

type BookChunkRow = {
  chunk_text: string;
  page: number;
};

export async function searchBookChunks({
  bookId,
  queryEmbedding,
  limit = 8,
}: {
  bookId: string;
  queryEmbedding: number[];
  limit?: number;
}): Promise<RetrievedChunk[]> {
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  const result = await db.execute<BookChunkRow>(
    sql`
      SELECT chunk_text, page
      FROM book_chunks
      WHERE book_id = ${bookId}
      ORDER BY embedding <-> ${vectorLiteral}::vector
      LIMIT ${Math.min(Math.max(limit, 1), 10)}
    `
  );

  return result.rows.map((row) => ({
    chunkText: row.chunk_text,
    page: row.page,
  }));
}
