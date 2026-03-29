import "server-only";

import { tool } from "langchain";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";

function buildContextExcerpt(text: string, query?: string, maxChars = 4_000) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return "";
  }

  if (!query?.trim()) {
    return normalizedText.slice(0, maxChars);
  }

  const normalizedQuery = query.toLowerCase();
  const lowerText = normalizedText.toLowerCase();
  const matchIndex = lowerText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return normalizedText.slice(0, maxChars);
  }

  const start = Math.max(0, matchIndex - Math.floor(maxChars / 2));
  const end = Math.min(normalizedText.length, start + maxChars);
  return normalizedText.slice(start, end);
}

export function createContextFetchTool(bookId: string) {
  return tool(
    async ({
      query,
      maxChars,
    }: {
      query?: string;
      maxChars?: number;
    }) => {
      await connectToDatabase();

      const book = await BookModel.findById(bookId)
        .select("title author description summary contextText status")
        .lean();

      if (!book) {
        return JSON.stringify({ error: "book_not_found", bookId }, null, 2);
      }

      const excerpt = buildContextExcerpt(
        book.contextText ?? "",
        query,
        maxChars ?? 4_000
      );

      return JSON.stringify(
        {
          bookId,
          title: book.title,
          author: book.author,
          description: book.description ?? "",
          summary: book.summary ?? "",
          status: book.status,
          excerpt,
        },
        null,
        2
      );
    },
    {
      name: "context_fetch",
      description:
        "Fetch existing Bookify context for a book, including summary data and a focused excerpt from the stored book text.",
      schema: z.object({
        query: z
          .string()
          .optional()
          .describe("Optional focus query used to find the most relevant excerpt."),
        maxChars: z
          .number()
          .int()
          .positive()
          .max(8_000)
          .optional()
          .describe("Maximum excerpt size in characters."),
      }),
    }
  );
}
