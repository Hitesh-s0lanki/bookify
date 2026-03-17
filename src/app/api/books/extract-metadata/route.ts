import { NextResponse } from "next/server";

import { extractBookMetadataWithGemini } from "@/lib/api/gemini";

const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const coverFile = formData.get("cover");

    if (!(coverFile instanceof File)) {
      return NextResponse.json({ error: "Cover file is required." }, { status: 400 });
    }

    if (!ALLOWED_COVER_TYPES.has(coverFile.type)) {
      return NextResponse.json({ error: "Cover must be JPG or PNG." }, { status: 400 });
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
