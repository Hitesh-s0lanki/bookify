import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { generateGetPresignedUrl } from "@/lib/api/s3";
import { BookModel } from "@/modules/books/model";

/**
 * Proxy the book PDF so the browser doesn't need direct S3 access.
 * Returns the raw PDF bytes with proper content-type headers.
 */
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
    const book = await BookModel.findById(id).select("+pdfBuffer").lean();
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Prefer the stored buffer for speed
    if (book.pdfBuffer) {
      const raw = book.pdfBuffer;
      const buf = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from((raw as { buffer: Uint8Array }).buffer ?? raw);

      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(buf.length),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Fallback: stream from S3 via presigned URL
    const s3Key = extractS3Key(book.pdfUrl);
    if (!s3Key) {
      return NextResponse.json({ error: "PDF not available" }, { status: 404 });
    }

    const signedUrl = await generateGetPresignedUrl({ key: s3Key });
    const s3Res = await fetch(signedUrl);
    if (!s3Res.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
    }

    const pdfBytes = await s3Res.arrayBuffer();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBytes.byteLength),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("GET /api/books/[id]/pdf", e);
    return NextResponse.json({ error: "Failed to serve PDF" }, { status: 500 });
  }
}

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
