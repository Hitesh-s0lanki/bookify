import { GoogleGenerativeAI } from "@google/generative-ai";

import type { RetrievedChunk } from "@/lib/vector-search";

const QUERY_TIMEOUT_MS = 20_000;

function getQueryModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const modelName =
    process.env.GEMINI_QUERY_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`LLM request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export async function generateAnswer({
  question,
  chunks,
  timeoutMs = QUERY_TIMEOUT_MS,
}: {
  question: string;
  chunks: RetrievedChunk[];
  timeoutMs?: number;
}): Promise<string> {
  const context = chunks
    .map((chunk, index) => `Chunk ${index + 1} (page ${chunk.page}):\n${chunk.chunkText}`)
    .join("\n\n");

  const prompt = `You are an AI assistant that answers questions about books.

Use the following context from the book to answer the question.

Context:
${context}

Question:
${question}

If the answer cannot be found in the context, say that the information is not present in the book.

Return a clear and concise answer.`;

  const model = getQueryModel();
  const result = await withTimeout(model.generateContent(prompt), timeoutMs);
  const answer = result.response.text().trim();

  return answer || "Sorry, I couldn't find relevant information in the book.";
}
