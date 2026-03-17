import { index, integer, pgTable, serial, text, vector } from "drizzle-orm/pg-core";

export const bookChunks = pgTable(
  "book_chunks",
  {
    id: serial("id").primaryKey(),
    bookId: text("book_id").notNull(),
    chunkText: text("chunk_text").notNull(),
    page: integer("page").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
  },
  (table) => [
    index("book_chunks_book_id_idx").on(table.bookId),
    index("book_chunks_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);
