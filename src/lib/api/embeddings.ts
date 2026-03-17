import { GoogleGenerativeAI } from "@google/generative-ai";

const BATCH_SIZE = 100;
const MAX_EMBEDDING_CACHE_SIZE = 200;

const queryEmbeddingCache = new Map<string, number[]>();

function getEmbeddingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "text-embedding-004" });
}

function normalizeQuestionForCache(question: string) {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

function setQueryEmbeddingCache(key: string, embedding: number[]) {
  if (queryEmbeddingCache.has(key)) {
    queryEmbeddingCache.delete(key);
  }
  queryEmbeddingCache.set(key, embedding);

  if (queryEmbeddingCache.size > MAX_EMBEDDING_CACHE_SIZE) {
    const firstKey = queryEmbeddingCache.keys().next().value;
    if (firstKey) {
      queryEmbeddingCache.delete(firstKey);
    }
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function generateQueryEmbedding(question: string): Promise<number[]> {
  const normalizedQuestion = normalizeQuestionForCache(question);
  const cached = queryEmbeddingCache.get(normalizedQuestion);

  if (cached) {
    return cached;
  }

  const embedding = await generateEmbedding(normalizedQuestion);
  setQueryEmbeddingCache(normalizedQuestion, embedding);
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();

  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const result = await model.batchEmbedContents({
      requests: batch.map((text) => ({
        content: { role: "user", parts: [{ text }] },
      })),
    });
    allEmbeddings.push(...result.embeddings.map((e) => e.values));
  }

  return allEmbeddings;
}
