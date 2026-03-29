import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { VoiceSessionModel } from "@/modules/voice/model";

const voiceMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  timestamp: z.string().datetime(),
});

const postBodySchema = z.object({
  messages: z.array(voiceMessageSchema).min(1),
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

  const bodyParsed = postBodySchema.safeParse(await request.json());
  if (!bodyParsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const { messages } = bodyParsed.data;

  await connectToDatabase();

  const session = await VoiceSessionModel.create({
    bookId,
    userId,
    messages: messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
  });

  return Response.json({ sessionId: String(session._id) }, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: bookId } = await params;

  await connectToDatabase();

  const sessions = await VoiceSessionModel.find({ bookId, userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return Response.json({ sessions });
}
