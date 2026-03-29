import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { ReadingProgressModel } from "@/modules/reading-progress/model";

const upsertSchema = z.object({
  bookId: z.string().min(1),
  currentPage: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { bookId, currentPage, totalPages } = parsed.data;

    await connectToDatabase();

    await ReadingProgressModel.findOneAndUpdate(
      { userId, bookId },
      { currentPage, totalPages, lastReadAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/reading-progress", e);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Count mode — returns how many distinct books this user has progress for
    const countMode = searchParams.get("count") === "1";
    if (countMode) {
      await connectToDatabase();
      const count = await ReadingProgressModel.countDocuments({ userId });
      return NextResponse.json({ count });
    }

    const bookId = searchParams.get("bookId");
    if (!bookId) {
      return NextResponse.json({ error: "bookId required" }, { status: 400 });
    }

    await connectToDatabase();

    const progress = await ReadingProgressModel.findOne({ userId, bookId })
      .select("currentPage totalPages")
      .lean();

    return NextResponse.json(
      progress
        ? { currentPage: progress.currentPage, totalPages: progress.totalPages }
        : null
    );
  } catch (e) {
    console.error("GET /api/reading-progress", e);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
