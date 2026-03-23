# AI SDK Chat Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder ChatPanel and non-streaming `/api/books/query` with a full Vercel AI SDK streaming chat interface featuring per-message metadata (timestamps, model, token usage, source pages).

**Architecture:** Install `ai` + `@ai-sdk/google`. Create a `/api/chat` streaming route using `streamText` + `toUIMessageStreamResponse` with a `messageMetadata` callback. On the client, `useChat<never, MessageMetadata>` drives a fully functional chat UI with source page chips and a streaming indicator. The existing `@google/generative-ai` package stays for embeddings and cover extraction — only the answer-generation step migrates.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Vercel AI SDK 4.x (`ai` + `@ai-sdk/google`), Zod 4, shadcn/ui (Textarea, Button, Badge, ScrollArea), Tailwind CSS 4, Lucide icons.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `ai` and `@ai-sdk/google` dependencies |
| `src/types/chat.ts` | Create | `MessageMetadata` Zod schema + `BookUIMessage` type |
| `src/lib/chat-stream.ts` | Create | `streamText()` wrapper with RAG context injection |
| `src/app/api/chat/route.ts` | Create | Streaming POST handler with `messageMetadata` callback |
| `src/app/api/books/query/route.ts` | Delete | Replaced by `/api/chat` |
| `src/lib/ai-response.ts` | Delete | Replaced by `src/lib/chat-stream.ts` |
| `src/app/(preview)/preview/[id]/_components/chat-panel.tsx` | Replace | Full chat UI: `useChat`, message bubbles, metadata footer, input bar |
| `src/app/(preview)/preview/[id]/_components/side-panel.tsx` | Modify | Add `onPageJump?: (page: number) => void` prop, pass to `ChatPanel` |
| `src/app/(preview)/preview/[id]/_components/preview-shell.tsx` | Modify | Pass `onPageJump={(page) => setCurrentPage(page)}` to both `SidePanel` usages |

---

## Task 1: Install Vercel AI SDK Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install ai@^4.3.0 @ai-sdk/google@^1.2.0
```

Expected: packages added to `node_modules`, `package.json` updated with both entries under `dependencies`.

- [ ] **Step 2: Verify TypeScript can resolve the packages**

```bash
npm run type-check
```

Expected: No errors about `ai` or `@ai-sdk/google` missing. (Other pre-existing errors are irrelevant for this step.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install ai and @ai-sdk/google for streaming chat"
```

---

## Task 2: Create Message Metadata Types

**Files:**
- Create: `src/types/chat.ts`

- [ ] **Step 1: Create the file**

```ts
// src/types/chat.ts
import { z } from "zod";
import type { UIMessage } from "ai";

export const messageMetadataSchema = z.object({
  createdAt: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
  sources: z.array(z.number()).optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// TOOLS generic is `never` — this app does not render tool-call parts.
// If Gemini returns a tool-call part, it is silently skipped during rendering.
export type BookUIMessage = UIMessage<never, MessageMetadata>;
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors in `src/types/chat.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/types/chat.ts
git commit -m "feat: add MessageMetadata types for AI SDK chat"
```

---

## Task 3: Create the `streamText` Chat Stream Helper

**Files:**
- Create: `src/lib/chat-stream.ts`

This replaces `src/lib/ai-response.ts`. It uses `@ai-sdk/google` + the `streamText` function from `ai` to stream an answer grounded in the retrieved book chunks.

- [ ] **Step 1: Create the file**

```ts
// src/lib/chat-stream.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type UIMessage } from "ai";

import type { RetrievedChunk } from "@/lib/vector-search";

const MAX_CONTEXT_MESSAGES = 10;

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const modelName =
    process.env.GEMINI_QUERY_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  const google = createGoogleGenerativeAI({ apiKey });
  return { model: google(modelName), modelName };
}

function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((chunk, i) => `Chunk ${i + 1} (page ${chunk.page}):\n${chunk.chunkText}`)
    .join("\n\n");

  return `You are an AI assistant that answers questions about books.
Use the following context from the book to answer the question.
If the answer cannot be found in the context, say that the information is not present in the book.
Return a clear and concise answer.

Context:
${context}`;
}

export function streamChatAnswer({
  chunks,
  messages,
}: {
  chunks: RetrievedChunk[];
  messages: UIMessage[];
}) {
  const { model, modelName } = getModel();
  const system = buildSystemPrompt(chunks);

  // Trim to last N messages to cap token spend
  const trimmedMessages = messages.slice(-MAX_CONTEXT_MESSAGES);

  return {
    result: streamText({
      model,
      system,
      messages: trimmedMessages as Parameters<typeof streamText>[0]["messages"],
    }),
    modelName,
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors in `src/lib/chat-stream.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/chat-stream.ts
git commit -m "feat: add streamText chat stream helper with RAG context"
```

---

## Task 4: Create the `/api/chat` Streaming Route

**Files:**
- Create: `src/app/api/chat/route.ts`

This is the core server handler. It runs the RAG pipeline, then streams the answer with message metadata.

Note on `messageMetadata` callback: The AI SDK v4 `finish` part exposes `part.usage` (shape: `{ promptTokens, completionTokens }`). **Do not use `part.totalUsage`** — that is on the `StreamTextResult` object, not the part.

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createUIMessageStream } from "ai";

import { streamChatAnswer } from "@/lib/chat-stream";
import { generateQueryEmbedding } from "@/lib/api/embeddings";
import { searchBookChunks } from "@/lib/vector-search";

// Aligns with Vercel serverless function timeout
export const maxDuration = 30;

const MAX_QUESTION_LENGTH = 1000;
const FALLBACK_TEXT = "I couldn't find relevant information in this book.";

const chatRequestSchema = z.object({
  bookId: z.string().trim().min(1, "bookId is required"),
  messages: z.array(z.any()).min(1, "messages array must not be empty"),
});

function extractQuestion(messages: { role: string; parts?: { type: string; text?: string }[]; content?: string }[]): string {
  // Find the last user message
  const userMessages = messages.filter((m) => m.role === "user");
  const last = userMessages[userMessages.length - 1];
  if (!last) return "";

  // AI SDK v4 messages use `parts` array; each part may have `text`
  if (Array.isArray(last.parts)) {
    return last.parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join(" ")
      .trim();
  }

  // Fallback: plain string content (shouldn't occur with useChat, but safe)
  return typeof last.content === "string" ? last.content.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = chatRequestSchema.parse(body);

    const question = extractQuestion(parsed.messages);

    if (!question) {
      return NextResponse.json({ error: "Could not extract question from messages." }, { status: 400 });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question must be ≤ ${MAX_QUESTION_LENGTH} characters.` },
        { status: 400 },
      );
    }

    // RAG pipeline
    const queryEmbedding = await generateQueryEmbedding(question);
    const chunks = await searchBookChunks({
      bookId: parsed.bookId,
      queryEmbedding,
      limit: 8,
    });

    // Fallback: no relevant content found
    if (chunks.length === 0) {
      const stream = createUIMessageStream({
        execute: (writer) => {
          writer.write({ type: "text", text: FALLBACK_TEXT });
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Stream answer with metadata
    const sources = [...new Set(chunks.map((c) => c.page))].sort((a, b) => a - b);
    const { result, modelName } = streamChatAnswer({
      chunks,
      messages: parsed.messages,
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return { createdAt: Date.now(), model: modelName };
        }
        if (part.type === "finish") {
          const promptTokens = (part as { usage?: { promptTokens?: number } }).usage?.promptTokens ?? 0;
          const completionTokens = (part as { usage?: { completionTokens?: number } }).usage?.completionTokens ?? 0;
          return { totalTokens: promptTokens + completionTokens, sources };
        }
      },
    });
  } catch (error) {
    console.error("POST /api/chat failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: error.issues.map((i) => i.message) },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to answer the question." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors in `src/app/api/chat/route.ts`. If `createUIMessageStream` or `appendResponseMessages` imports cause issues, check the exact export names in the installed `ai` package: `node_modules/ai/dist/index.d.ts`.

- [ ] **Step 3: Verify the route builds**

```bash
npm run build 2>&1 | grep -E "(error|Error|✓|○)" | head -30
```

Expected: The `/api/chat` route compiles without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add /api/chat streaming route with AI SDK and message metadata"
```

---

## Task 5: Delete Old Files

**Files:**
- Delete: `src/app/api/books/query/route.ts`
- Delete: `src/lib/ai-response.ts`

- [ ] **Step 1: Delete the old query route**

```bash
rm src/app/api/books/query/route.ts
rmdir src/app/api/books/query 2>/dev/null || true
```

- [ ] **Step 2: Delete the old AI response helper**

```bash
rm src/lib/ai-response.ts
```

- [ ] **Step 3: Check nothing else imports these files**

```bash
grep -r "ai-response" src/ --include="*.ts" --include="*.tsx"
grep -r "books/query" src/ --include="*.ts" --include="*.tsx"
```

Expected: No output — nothing else imports these files.

- [ ] **Step 4: Type-check to confirm no dangling imports**

```bash
npm run type-check
```

Expected: No errors referencing `ai-response` or `books/query`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old /api/books/query route and ai-response helper"
```

---

## Task 6: Build the Full ChatPanel UI

**Files:**
- Replace: `src/app/(preview)/preview/[id]/_components/chat-panel.tsx`

This is the main UI component. It uses `useChat` from the `ai` package (AI SDK v4), renders messages with streaming indicator, metadata footer with source chips, and an input bar.

- [ ] **Step 1: Replace the file entirely**

```tsx
// src/app/(preview)/preview/[id]/_components/chat-panel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { DefaultChatTransport } from "ai";
import { BookOpen, Send, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/book";
import type { MessageMetadata } from "@/types/chat";

interface ChatPanelProps {
  book: Book;
  currentPage: number;
  onPageJump?: (page: number) => void;
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

interface MessageMetadataFooterProps {
  metadata: MessageMetadata;
  onPageJump?: (page: number) => void;
}

function MessageMetadataFooter({ metadata, onPageJump }: MessageMetadataFooterProps) {
  const hasSources = metadata.sources && metadata.sources.length > 0;
  const hasInfo = metadata.model || metadata.totalTokens !== undefined;
  const hasTimestamp = metadata.createdAt !== undefined;

  if (!hasSources && !hasInfo) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      {hasSources && (
        <div className="flex flex-wrap gap-1">
          {metadata.sources!.map((page) => (
            <button
              key={page}
              onClick={() => onPageJump?.(page)}
              className={cn(
                "rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors",
                onPageJump && "cursor-pointer hover:bg-primary/15",
                !onPageJump && "cursor-default",
              )}
            >
              p.{page}
            </button>
          ))}
        </div>
      )}
      {(hasInfo || hasTimestamp) && (
        <p className="text-[10px] text-muted-foreground">
          {[
            metadata.model,
            metadata.totalTokens !== undefined && `${metadata.totalTokens} tokens`,
            metadata.createdAt !== undefined &&
              new Date(metadata.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

export function ChatPanel({ book, currentPage: _currentPage, onPageJump }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, error } = useChat<never, MessageMetadata>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { bookId: book.id },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ role: "user", parts: [{ type: "text", text: trimmed }] });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Message area */}
      <ScrollArea className="flex-1 px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Ask anything about this book</p>
            <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
              Questions are answered using the book&apos;s content
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const isLastAssistant =
                !isUser && index === messages.length - 1 && isStreaming;

              return (
                <div
                  key={message.id}
                  className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                      isUser
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "rounded-tl-sm bg-muted text-foreground",
                    )}
                  >
                    {message.parts.map((part, partIndex) => {
                      if (part.type !== "text") return null;
                      return (
                        <span key={partIndex} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </span>
                      );
                    })}
                    {isLastAssistant && <TypingDots />}
                  </div>

                  {/* Metadata footer for assistant messages */}
                  {!isUser && message.metadata && (
                    <div className="mt-0.5 max-w-[85%]">
                      <MessageMetadataFooter
                        metadata={message.metadata}
                        onPageJump={onPageJump}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Standalone typing indicator before first assistant token arrives */}
            {status === "submitted" && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Error banner */}
      {error && (
        <div className="mx-3 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Input bar */}
      <div className="border-t bg-card p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this book..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => stop()}
            >
              <Square className="size-3.5 fill-current" />
              <span className="sr-only">Stop</span>
            </Button>
          ) : (
            <Button
              size="icon"
              className="size-9 shrink-0"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              <Send className="size-3.5" />
              <span className="sr-only">Send</span>
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: No errors in `chat-panel.tsx`. Note the intentional split imports: `useChat` comes from `"ai/react"` and `DefaultChatTransport` from `"ai"` — these are different entry points in the AI SDK v4 package.

- [ ] **Step 3: Lint**

```bash
npm run lint -- --max-warnings=0 src/app/\\(preview\\)/preview/\\[id\\]/_components/chat-panel.tsx
```

Expected: No lint errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/chat-panel.tsx
git commit -m "feat: implement full streaming ChatPanel with AI SDK useChat and message metadata"
```

---

## Task 7: Thread `onPageJump` Through SidePanel and PreviewShell

**Files:**
- Modify: `src/app/(preview)/preview/[id]/_components/side-panel.tsx`
- Modify: `src/app/(preview)/preview/[id]/_components/preview-shell.tsx`

- [ ] **Step 1: Update `SidePanelProps` and pass `onPageJump` to `ChatPanel`**

In `side-panel.tsx`, update the interface and the `SidePanel` function signature:

```tsx
// Change the interface from:
interface SidePanelProps {
  book: Book;
  currentPage: number;
}

// To:
interface SidePanelProps {
  book: Book;
  currentPage: number;
  onPageJump?: (page: number) => void;
}

// Change the function signature from:
export function SidePanel({ book, currentPage }: SidePanelProps) {

// To:
export function SidePanel({ book, currentPage, onPageJump }: SidePanelProps) {
```

Then update the `ChatPanel` usage in `side-panel.tsx` from:

```tsx
<ChatPanel book={book} currentPage={currentPage} />
```

To:

```tsx
<ChatPanel book={book} currentPage={currentPage} onPageJump={onPageJump} />
```

Also update the `TabsContent` wrapper for the chat tab so that `ChatPanel`'s `ScrollArea` can expand correctly. Change:

```tsx
<TabsContent value="chat" className="overflow-hidden">
```

To:

```tsx
<TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
```

Without `flex-1 min-h-0`, the `ScrollArea` inside `ChatPanel` will collapse to zero height.

- [ ] **Step 2: Pass `onPageJump` from `PreviewShell` to both `SidePanel` usages**

In `preview-shell.tsx`, find the mobile sheet `SidePanel` (line ~72):

```tsx
<SidePanel book={book} currentPage={currentPage} />
```

Change it to:

```tsx
<SidePanel
  book={book}
  currentPage={currentPage}
  onPageJump={(page) => setCurrentPage(page)}
/>
```

Find the desktop `SidePanel` (line ~93):

```tsx
<SidePanel book={book} currentPage={currentPage} />
```

Change it to:

```tsx
<SidePanel
  book={book}
  currentPage={currentPage}
  onPageJump={(page) => setCurrentPage(page)}
/>
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: No errors in `side-panel.tsx` or `preview-shell.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/side-panel.tsx \
        src/app/(preview)/preview/[id]/_components/preview-shell.tsx
git commit -m "feat: thread onPageJump prop through SidePanel and PreviewShell"
```

---

## Task 8: Full Build Verification

- [ ] **Step 1: Full type-check**

```bash
npm run type-check
```

Expected: Zero errors.

- [ ] **Step 2: Full lint**

```bash
npm run lint
```

Expected: Zero errors (warnings are acceptable if pre-existing).

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: Build completes. Routes listed should include `/api/chat`. Routes `/api/books/query` should not appear.

- [ ] **Step 4: Start dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:3001`. Navigate to any book preview page. Open the Chat tab. Verify:

- [ ] Empty state shows ("Ask anything about this book")
- [ ] Type a question, press Enter — message appears right-aligned
- [ ] Typing indicator (animated dots) appears immediately
- [ ] Answer streams in character-by-character (left-aligned bubble)
- [ ] After stream ends: source page chips appear below answer (e.g. `p.12`)
- [ ] Metadata line appears: `gemini-2.0-flash · N tokens · HH:MM`
- [ ] Click a source chip → PDF viewer jumps to that page
- [ ] Stop button appears during streaming; clicking it stops generation
- [ ] Send button is disabled during streaming
- [ ] Mobile: tap MessageCircle button → bottom sheet opens → chat works same way

---

## Acceptance Criteria (from spec)

- [ ] Message streams character-by-character (not batched)
- [ ] Metadata appears after stream completes (not during)
- [ ] Source page chips render correctly for multi-page results
- [ ] `onPageJump` fires with correct page number on chip click and updates PDF viewer
- [ ] Stop button aborts the stream
- [ ] Error state renders when API fails
- [ ] Empty state shows before first message
- [ ] Auto-scroll triggers on `messages.length` change, not every re-render
- [ ] Zero-chunk fallback streams the canned message without calling `streamText`
- [ ] Question > 1000 chars returns 400 without calling Gemini
- [ ] `totalTokens` is correctly summed from `promptTokens + completionTokens`
