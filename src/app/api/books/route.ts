import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { generateGetPresignedUrl } from "@/lib/api/s3";
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const includeAll = searchParams.get("all") === "1";

    const filter: Record<string, unknown> = includeAll
      ? {}
      : { status: { $in: ["ready", "READY"] } };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { title: regex },
        { author: regex },
        { genre: regex },
        { tags: regex },
      ];
    }

    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 120) : (q ? 40 : 120);
    const skip = skipParam ? Math.max(0, parseInt(skipParam, 10)) : 0;

    await connectToDatabase();
    const docs = await BookModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const books: Book[] = docs.map((d) => toBook(d as Parameters<typeof toBook>[0]));

    // Sign cover URLs so S3 objects don't need to be public
    await Promise.all(
      books.map(async (book) => {
        try {
          if (book.coverUrl) {
            const key = extractS3Key(book.coverUrl);
            if (key) book.coverUrl = await generateGetPresignedUrl({ key });
          }
        } catch {
          // Keep original URL as fallback
        }
      })
    );

    return NextResponse.json(books);
  } catch (e) {
    console.error("GET /api/books", e);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

/** Extract S3 object key from a full S3 URL */
function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("amazonaws.com")) {
      return decodeURIComponent(parsed.pathname.slice(1));
    }
  } catch {
    // Not a valid URL
  }
  return null;
}
