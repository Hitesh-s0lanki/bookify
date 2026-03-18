import { NextResponse } from "next/server";

import { extractBookMetadataWithGemini } from "@/lib/api/gemini";

const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Request too large. Only send the cover image (max 10 MB)." },
        { status: 413 },
      );
    }

    const coverFile = formData.get("cover");

    if (!(coverFile instanceof File)) {
      return NextResponse.json({ error: "Cover file is required." }, { status: 400 });
    }

    if (!ALLOWED_COVER_TYPES.has(coverFile.type)) {
      return NextResponse.json({ error: "Cover must be JPG or PNG." }, { status: 400 });
    }

    if (coverFile.size > MAX_COVER_SIZE) {
      return NextResponse.json({ error: "Cover image must be 10 MB or smaller." }, { status: 400 });
    }

    const coverBase64 = Buffer.from(await coverFile.arrayBuffer()).toString("base64");

    const metadata = await extractBookMetadataWithGemini({
      coverBase64,
      coverMimeType: coverFile.type,
    });

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Failed to extract metadata", error);
    return NextResponse.json(
      { error: "Metadata extraction failed." },
      { status: 500 },
    );
  }
}
