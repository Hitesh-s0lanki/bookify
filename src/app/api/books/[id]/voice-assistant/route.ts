import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { createVapiAssistant } from "@/lib/api/vapi";
import { BookModel } from "@/modules/books/model";
import { VOICE_PERSONAS } from "@/modules/books/constants";

const bodySchema = z.object({
  voicePersona: z.enum(VOICE_PERSONAS),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookId } = await params;

  const bodyParsed = bodySchema.safeParse(await request.json());
  if (!bodyParsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const { voicePersona } = bodyParsed.data;

  await connectToDatabase();

  const doc = await BookModel.findById(bookId).select("title contextText").lean();
  if (!doc) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  const context = (doc as { contextText?: string }).contextText ?? "";

  const assistantId = await createVapiAssistant({
    title: (doc as { title: string }).title,
    voicePersona,
    context,
  });

  return Response.json({ assistantId });
}
