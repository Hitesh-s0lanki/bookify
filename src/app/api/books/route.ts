import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";
import type { Book } from "@/types/book";

function toBook(doc: {
  _id: unknown;
  title: string;
  author: string;
  coverUrl?: string;
  pdfUrl: string;
  voicePersona?: string;
  status: string;
  createdAt?: Date;
  description?: string;
  genre?: string;
  tags?: string[];
}): Book {
  const normalizedStatus =
    doc.status === "ready" || doc.status === "READY"
      ? "ready"
      : doc.status === "FAILED"
        ? "FAILED"
        : doc.status === "UPLOADED"
          ? "UPLOADED"
          : doc.status === "PROCESSING"
            ? "PROCESSING"
            : "pending";

  return {
    id: String(doc._id),
    title: doc.title,
    author: doc.author,
    coverUrl: doc.coverUrl ?? "",
    pdfUrl: doc.pdfUrl,
    voicePersona: doc.voicePersona,
    status: normalizedStatus,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    description: doc.description,
    genre: doc.genre,
    tags: doc.tags,
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    const docs = await BookModel.find({ status: { $in: ["ready", "READY"] } }).sort({ createdAt: -1 }).lean();
    const books: Book[] = docs.map((d) => toBook(d as Parameters<typeof toBook>[0]));
    return NextResponse.json(books);
  } catch (e) {
    console.error("GET /api/books", e);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
