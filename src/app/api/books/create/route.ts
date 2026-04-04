import { auth } from "@clerk/nextjs/server";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { triggerBookUploadedEvent } from "@/lib/inngest/trigger";
import { generatePresignedUrl, getPublicS3Url, uploadFile } from "@/lib/api/s3";
import { BookModel } from "@/modules/books/model";
import { UserModel } from "@/modules/user/model";
import { createBookSchema } from "@/modules/books/schema";

const FREE_PLAN_BOOK_LIMIT = 2;

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

function normalizeTags(rawTags: FormDataEntryValue | null) {
  if (typeof rawTags !== "string" || !rawTags.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawTags);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag));
    }
  } catch {
    return rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await UserModel.findOne({ clerkId: userId }).select("plan").lean();
    if (!user || user.plan !== "pro") {
      const bookCount = await BookModel.countDocuments({ userId });
      if (bookCount >= FREE_PLAN_BOOK_LIMIT) {
        return NextResponse.json(
          { error: `Free plan is limited to ${FREE_PLAN_BOOK_LIMIT} books. Upgrade to Pro for unlimited books.`, limitReached: true },
          { status: 402 }
        );
      }
    }

    const contentType = request.headers.get("content-type") ?? "";

    let parsedData: z.infer<typeof createBookSchema>;
    let pdfFile: FormDataEntryValue | null = null;
    let coverFile: FormDataEntryValue | null = null;

    if (contentType.includes("application/json")) {
      const jsonBody = await request.json();
      parsedData = createBookSchema.parse(jsonBody);
    } else {
      const formData = await request.formData();
      parsedData = createBookSchema.parse({
        title: formData.get("title"),
        author: formData.get("author"),
        description: formData.get("description"),
        genre: formData.get("genre"),
        tags: normalizeTags(formData.get("tags")),
        summaryPrompt: formData.get("summaryPrompt"),
        pdfUrl: formData.get("pdfUrl") ?? undefined,
        coverUrl: formData.get("coverUrl") ?? undefined,
      });
      pdfFile = formData.get("pdf");
      coverFile = formData.get("cover");
    }

    let finalPdfUrl = parsedData.pdfUrl ?? "";
    let finalCoverUrl = parsedData.coverUrl ?? "";
    let pdfBuffer: Buffer | null = null;
    const bookId = new Types.ObjectId();
    const MAX_BUFFER_SIZE = 14 * 1024 * 1024; // 14MB MongoDB doc limit safety margin

    if (pdfFile instanceof File && coverFile instanceof File) {
      if (pdfFile.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
      }

      if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
        return NextResponse.json({ error: "PDF must be 50MB or smaller." }, { status: 400 });
      }

      if (!ALLOWED_COVER_TYPES.has(coverFile.type)) {
        return NextResponse.json({ error: "Cover must be JPG or PNG." }, { status: 400 });
      }

      const pdfKey = `books/${bookId.toString()}/book.pdf`;
      const coverKey = `books/${bookId.toString()}/cover.jpg`;

      const [pdfSigned, coverSigned] = await Promise.all([
        generatePresignedUrl({ key: pdfKey, contentType: "application/pdf" }),
        generatePresignedUrl({ key: coverKey, contentType: coverFile.type }),
      ]);

      await Promise.all([
        uploadFile({ file: pdfFile, url: pdfSigned.url, contentType: "application/pdf" }),
        uploadFile({ file: coverFile, url: coverSigned.url, contentType: coverFile.type }),
      ]);

      finalPdfUrl = getPublicS3Url(pdfKey);
      finalCoverUrl = getPublicS3Url(coverKey);

      if (pdfFile.size <= MAX_BUFFER_SIZE) {
        pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
      }
    }

    if (!finalPdfUrl || !finalCoverUrl) {
      return NextResponse.json(
        { error: "Provide PDF and cover files or valid pdfUrl/coverUrl." },
        { status: 400 }
      );
    }

    await BookModel.create({
      _id: bookId,
      title: parsedData.title,
      author: parsedData.author,
      userId,
      description: parsedData.description,
      genre: parsedData.genre,
      tags: parsedData.tags,
      summaryPrompt: parsedData.summaryPrompt,
      pdfUrl: finalPdfUrl,
      coverUrl: finalCoverUrl,
      pdfBuffer,
      status: "UPLOADED",
      uploadedAt: new Date(),
    });

    await triggerBookUploadedEvent({
      bookId: bookId.toString(),
      pdfUrl: finalPdfUrl,
    });

    return NextResponse.json({
      bookId: bookId.toString(),
      status: "UPLOADED",
    });
  } catch (error) {
    console.error("Failed to create book", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          details: error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to upload book." }, { status: 500 });
  }
}
