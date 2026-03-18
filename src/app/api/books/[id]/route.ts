import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { generateGetPresignedUrl } from "@/lib/api/s3";
import { deleteChunksForBook } from "@/lib/vector-store";
import { triggerBookUploadedEvent } from "@/lib/inngest/trigger";
import { BookModel } from "@/modules/books/model";
import type { Book } from "@/types/book";

const updateBookSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  author: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(3000).optional(),
  genre: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

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
  failureReason?: string;
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
    failureReason: doc.failureReason,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing book id" }, { status: 400 });
  }
  try {
    await connectToDatabase();
    const doc = await BookModel.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    const book = toBook(doc as Parameters<typeof toBook>[0]);

    // Generate signed URLs so S3 objects don't need to be public
    try {
      if (book.coverUrl) {
        const coverKey = extractS3Key(book.coverUrl);
        if (coverKey) book.coverUrl = await generateGetPresignedUrl({ key: coverKey });
      }
      if (book.pdfUrl) {
        const pdfKey = extractS3Key(book.pdfUrl);
        if (pdfKey) book.pdfUrl = await generateGetPresignedUrl({ key: pdfKey });
      }
    } catch {
      // If signing fails, keep original URLs as fallback
    }

    return NextResponse.json(book);
  } catch (e) {
    console.error("GET /api/books/[id]", e);
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }
}

/** PATCH — update book metadata */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing book id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = updateBookSchema.parse(body);

    await connectToDatabase();
    const doc = await BookModel.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await BookModel.updateOne({ _id: id }, { $set: parsed });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: e.issues.map((i) => i.message) },
        { status: 400 }
      );
    }
    console.error("PATCH /api/books/[id]", e);
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

/** POST — reprocess a failed book */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing book id" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const doc = await BookModel.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    if (doc.status !== "FAILED") {
      return NextResponse.json(
        { error: "Only failed books can be reprocessed" },
        { status: 400 }
      );
    }

    // Reset status and clear old failure reason
    await BookModel.updateOne(
      { _id: id },
      { status: "PROCESSING", failureReason: "" }
    );

    await triggerBookUploadedEvent({
      bookId: id,
      pdfUrl: doc.pdfUrl,
    });

    return NextResponse.json({ success: true, status: "PROCESSING" });
  } catch (e) {
    console.error("POST /api/books/[id] (reprocess)", e);
    return NextResponse.json({ error: "Failed to reprocess book" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing book id" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const doc = await BookModel.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Delete vector chunks from Neon
    await deleteChunksForBook(id);

    // Delete the book document
    await BookModel.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/books/[id]", e);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}

/** Extract S3 object key from a full S3 URL */
function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    // https://bucket.s3.region.amazonaws.com/key
    if (parsed.hostname.includes("amazonaws.com")) {
      return decodeURIComponent(parsed.pathname.slice(1));
    }
  } catch {
    // Not a valid URL
  }
  return null;
}
