import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import { streamText, createUIMessageStream, createUIMessageStreamResponse, tool, zodSchema, stepCountIs } from "ai";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";
import { ChatSessionModel } from "@/modules/chat/model";
import { generateQueryEmbedding } from "@/lib/api/embeddings";
import { searchBookChunks } from "@/lib/vector-search";

export const maxDuration = 30;

const goToPageTool = tool({
  description: "Navigate the PDF viewer to a specific page number.",
  inputSchema: zodSchema(
    z.object({
      page: z.number().int().min(1).describe("The 1-based page number to navigate to"),
    })
  ),
  // No execute — client handles navigation
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id: bookId } = await params;
  const body = await request.json();
  const { messages, sessionId: incomingSessionId } = body as {
    messages: { role: string; content: string }[];
    sessionId?: string;
  };

  await connectToDatabase();

  // Load book and check readiness
  const book = await BookModel.findById(bookId).lean();
  if (!book) {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
  }
  const status = (book as { status: string }).status;
  if (status !== "ready" && status !== "READY") {
    return new Response(JSON.stringify({ error: "book_not_ready" }), { status: 400 });
  }

  // Load or create ChatSession
  let session;
  let sessionId: string;

  if (incomingSessionId) {
    session = await ChatSessionModel.findById(incomingSessionId);
    if (!session || session.userId !== userId) {
      return new Response(JSON.stringify({ error: "session_not_found" }), { status: 404 });
    }
    sessionId = incomingSessionId;
  } else {
    session = await ChatSessionModel.create({ bookId, userId, messages: [] });
    sessionId = session._id.toString();
  }

  // RAG: embed latest user message and retrieve relevant chunks
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUserMessage?.content ?? "";

  const queryEmbedding = await generateQueryEmbedding(userText);
  const chunks = await searchBookChunks({ bookId, queryEmbedding, limit: 8 });

  const excerpts = chunks
    .map((c) => `Page ${c.page}: ${c.chunkText}`)
    .join("\n\n");

  const bookTitle = (book as { title: string }).title;
  const bookAuthor = (book as { author: string }).author;

  const systemPrompt = `You are an AI assistant helping the user understand the book "${bookTitle}" by ${bookAuthor}.
Use the following excerpts to answer the user's question.
When referencing a specific passage, call the go_to_page tool to navigate there.

Before answering, reason step-by-step inside <think>...</think> tags.
After the closing </think> tag, write your final answer in plain prose.

Excerpts:
${excerpts}`;

  // Stream response using createUIMessageStream for custom metadata injection
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Send sessionId as message-metadata so the client can persist it
      writer.write({ type: "message-metadata", messageMetadata: { sessionId } });

      const result = streamText({
        model: openai("gpt-4o"),
        system: systemPrompt,
        messages: messages as import("ai").ModelMessage[],
        tools: { go_to_page: goToPageTool },
        stopWhen: stepCountIs(1),
        onFinish: async ({ text, toolCalls }) => {
          try {
            // Extract and strip reasoning
            const reasoningMatch = text.match(/<think>([\s\S]*?)<\/think>/);
            const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null;
            const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

            // Write reasoning annotation back to the stream so the client receives it
            if (reasoning) {
              const reasoningId = crypto.randomUUID();
              writer.write({ type: "reasoning-start", id: reasoningId });
              writer.write({ type: "reasoning-delta", id: reasoningId, delta: reasoning });
              writer.write({ type: "reasoning-end", id: reasoningId });
            }

            // Persist to MongoDB
            const userMsg = {
              id: crypto.randomUUID(),
              role: "user" as const,
              content: userText,
              reasoning: null,
              toolCalls: [],
            };
            const assistantMsg = {
              id: crypto.randomUUID(),
              role: "assistant" as const,
              content: cleanText,
              reasoning,
              toolCalls: toolCalls.map((tc) => ({
                toolName: tc.toolName,
                args: tc.input,
              })),
            };

            await ChatSessionModel.findByIdAndUpdate(sessionId, {
              $push: { messages: { $each: [userMsg, assistantMsg] } },
            });
          } catch {
            // Ignore persistence errors — stream already sent
          }
        },
      });

      // Merge the LLM stream — reasoning chunks will be written in onFinish
      writer.merge(result.toUIMessageStream());

      // Wait for the full stream (including onFinish) to complete
      // before this execute Promise resolves (which would close the writer)
      await result.consumeStream();
    },
  });

  return createUIMessageStreamResponse({ stream });
}
