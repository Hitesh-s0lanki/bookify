import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAnswer } from "@/lib/ai-response";
import { generateQueryEmbedding } from "@/lib/api/embeddings";
import { searchBookChunks } from "@/lib/vector-search";

const MAX_QUESTION_LENGTH = 1000;
const DEFAULT_CHUNK_LIMIT = 8;
const FALLBACK_ANSWER = "Sorry, I couldn't find relevant information in the book.";

const querySchema = z.object({
  bookId: z.string().trim().min(1, "bookId is required"),
  question: z
    .string()
    .trim()
    .min(1, "question is required")
    .max(MAX_QUESTION_LENGTH, `question must be <= ${MAX_QUESTION_LENGTH} characters`),
});

type QueryRequest = z.infer<typeof querySchema>;

export async function handleQueryRequest(payload: QueryRequest) {
  const queryEmbedding = await generateQueryEmbedding(payload.question);
  const chunks = await searchBookChunks({
    bookId: payload.bookId,
    queryEmbedding,
    limit: DEFAULT_CHUNK_LIMIT,
  });

  if (chunks.length === 0) {
    return {
      answer: FALLBACK_ANSWER,
      sources: [] as number[],
    };
  }

  const answer = await generateAnswer({
    question: payload.question,
    chunks,
  });

  const sources = [...new Set(chunks.map((chunk) => chunk.page))].sort((a, b) => a - b);

  return {
    answer,
    sources,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = querySchema.parse(body);
    const result = await handleQueryRequest(payload);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/books/query failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to answer the question for this book." },
      { status: 500 }
    );
  }
}
