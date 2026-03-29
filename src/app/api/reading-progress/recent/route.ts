import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { ReadingProgressModel } from "@/modules/reading-progress/model";
import { BookModel } from "@/modules/books/model";
import { generateGetPresignedUrl } from "@/lib/api/s3";

function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("amazonaws.com")) {
      return decodeURIComponent(parsed.pathname.slice(1));
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const recentProgress = await ReadingProgressModel.find({ userId })
      .sort({ lastReadAt: -1 })
      .limit(5)
      .lean();

    if (recentProgress.length === 0) {
      return NextResponse.json([]);
    }

    const bookIds = recentProgress.map((p) => p.bookId);
    const books = await BookModel.find({ _id: { $in: bookIds } })
      .select("_id title author coverUrl status")
      .lean();

    const bookMap = new Map(books.map((b) => [String(b._id), b]));

    const results = await Promise.all(
      recentProgress.map(async (p) => {
        const book = bookMap.get(p.bookId);
        if (!book) return null;

        let coverUrl = book.coverUrl ?? "";
        try {
          const key = extractS3Key(coverUrl);
          if (key) coverUrl = await generateGetPresignedUrl({ key });
        } catch {
          // keep original
        }

        return {
          bookId: p.bookId,
          currentPage: p.currentPage,
          totalPages: p.totalPages,
          lastReadAt: p.lastReadAt,
          book: {
            id: String(book._id),
            title: book.title,
            author: book.author,
            coverUrl,
            status: book.status,
          },
        };
      })
    );

    return NextResponse.json(results.filter(Boolean));
  } catch (e) {
    console.error("GET /api/reading-progress/recent", e);
    return NextResponse.json({ error: "Failed to fetch recent progress" }, { status: 500 });
  }
}
