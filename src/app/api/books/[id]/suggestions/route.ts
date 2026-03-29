import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookId } = await params;

  await connectToDatabase();
  const book = await BookModel.findById(bookId).lean();
  if (!book) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const meta = [
    `Title: ${book.title}`,
    book.author ? `Author: ${book.author}` : null,
    book.description ? `Description: ${book.description}` : null,
    book.genre ? `Genre: ${book.genre}` : null,
    book.tags?.length ? `Tags: ${book.tags.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a reading assistant. Based on the following book metadata, generate exactly 4 short, engaging questions a reader might ask. Each question should be on its own line. No numbering, no bullets, no extra text. Make them specific to this book and genuinely useful.

${meta}`;

  try {
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const suggestions = text
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.endsWith("?"))
      .slice(0, 4);

    if (suggestions.length < 2) {
      return Response.json({ suggestions: getFallback(book.title) });
    }

    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: getFallback(book.title) });
  }
}

function getFallback(title: string): string[] {
  return [
    `What is "${title}" about?`,
    "Who are the key figures or characters?",
    "What are the main themes explored?",
    "Summarise the opening chapter",
  ];
}
