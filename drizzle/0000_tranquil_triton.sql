CREATE TABLE "book_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"chunk_text" text NOT NULL,
	"page" integer NOT NULL,
	"embedding" vector(768) NOT NULL
);
--> statement-breakpoint
CREATE INDEX "book_chunks_book_id_idx" ON "book_chunks" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_chunks_embedding_idx" ON "book_chunks" USING hnsw ("embedding" vector_cosine_ops);