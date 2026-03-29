# AI Chat Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `ChatPanel` placeholder with a full streaming AI chat interface backed by GPT-4o + RAG over the book's Neon vector chunks, with PDF page navigation via a client-side tool call, collapsible reasoning, and MongoDB session persistence.

**Architecture:** The server streams GPT-4o responses via Vercel AI SDK `streamText`, injecting RAG context from `searchBookChunks` (Neon) into the system prompt. The client uses `useChat` from `ai/react` to render streaming messages and handles the `go_to_page` tool call client-side by calling `onPageChange`. Sessions are persisted to a new `ChatSession` MongoDB collection.

**Tech Stack:** `ai` (Vercel AI SDK v4), `@ai-sdk/openai`, Next.js App Router API routes, Mongoose (MongoDB), `useChat`, `react-markdown`, shadcn `Collapsible` / `ScrollArea` / `Skeleton` / `Badge` / `Textarea`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/modules/chat/model.ts` | ChatSession + StoredMessage Mongoose schemas |
| Create | `src/app/api/books/[id]/chat/route.ts` | POST (streaming) + GET (session fetch) handlers |
| Create | `src/app/(preview)/preview/[id]/_components/chat-welcome.tsx` | Empty-state with suggestion chips |
| Create | `src/app/(preview)/preview/[id]/_components/chat-input.tsx` | Textarea + send button |
| Create | `src/app/(preview)/preview/[id]/_components/reasoning-block.tsx` | Collapsible `<think>` block |
| Create | `src/app/(preview)/preview/[id]/_components/go-to-page-tool-call.tsx` | Badge showing page navigation tool call |
| Create | `src/app/(preview)/preview/[id]/_components/chat-message.tsx` | Renders single user/assistant message |
| Create | `src/app/(preview)/preview/[id]/_components/chat-message-list.tsx` | Scrollable list with auto-scroll |
| Modify | `src/app/(preview)/preview/[id]/_components/chat-panel.tsx` | Full replacement — orchestrator with `useChat` |
| Modify | `src/app/(preview)/preview/[id]/_components/side-panel.tsx` | Add `numPages` + `onPageChange` props |
| Modify | `src/app/(preview)/preview/[id]/_components/preview-shell.tsx` | Thread `numPages` + `onPageChange` into both `SidePanel` usages |

---

## Task 1: Install AI SDK Packages

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install packages**

```bash
npm install ai @ai-sdk/openai
```

Expected output: packages added successfully, no peer dependency errors.

- [ ] **Step 2: Add env var placeholder**

Open `.env.local` and add this line (fill in with a real key before testing):

```
OPENAI_API_KEY=sk-...your-key-here...
```

- [ ] **Step 3: Verify TypeScript can resolve the imports**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors (or only pre-existing errors unrelated to `ai`/`@ai-sdk/openai`).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install vercel ai sdk and openai provider"
```

---

## Task 2: ChatSession MongoDB Model

**Files:**
- Create: `src/modules/chat/model.ts`

- [ ] **Step 1: Create the model file**

```typescript
// src/modules/chat/model.ts
import { model, models, Schema, type InferSchemaType } from "mongoose";

const storedMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    reasoning: { type: String, default: null },
    toolCalls: [
      {
        toolName: { type: String },
        args: { type: Schema.Types.Mixed },
      },
    ],
  },
  { _id: false }
);

const chatSessionSchema = new Schema(
  {
    bookId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messages: [storedMessageSchema],
  },
  { timestamps: true }
);

// 30-day TTL on updatedAt
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export type StoredMessage = InferSchemaType<typeof storedMessageSchema>;
export type ChatSessionDocument = InferSchemaType<typeof chatSessionSchema>;

export const ChatSessionModel =
  models.ChatSession || model("ChatSession", chatSessionSchema);
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit 2>&1 | grep "chat/model" | head -10
```

Expected: no output (no errors in this file).

- [ ] **Step 3: Commit**

```bash
git add src/modules/chat/model.ts
git commit -m "feat: add ChatSession mongoose model with 30-day TTL"
```

---

## Task 3: POST /api/books/[id]/chat — Streaming Route

**Files:**
- Create: `src/app/api/books/[id]/chat/route.ts`

- [ ] **Step 1: Create the route file with the POST handler**

```typescript
// src/app/api/books/[id]/chat/route.ts
import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import { streamText, StreamData, tool } from "ai";
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
  parameters: z.object({
    page: z.number().int().min(1).describe("The 1-based page number to navigate to"),
  }),
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

  // Stream response
  const streamData = new StreamData();

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: messages as Parameters<typeof streamText>[0]["messages"],
    tools: { go_to_page: goToPageTool },
    maxSteps: 1,
    onFinish: async ({ text, toolCalls }) => {
      try {
        // Extract and strip reasoning
        const reasoningMatch = text.match(/<think>([\s\S]*?)<\/think>/);
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : null;
        const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        // Send annotations to client
        if (reasoning) {
          streamData.append({ type: "reasoning", content: reasoning });
        }
        streamData.append({ type: "sessionId", content: sessionId });

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
            args: tc.args,
          })),
        };

        await ChatSessionModel.findByIdAndUpdate(sessionId, {
          $push: { messages: { $each: [userMsg, assistantMsg] } },
        });
      } finally {
        streamData.close();
      }
    },
  });

  return result.toDataStreamResponse({ data: streamData });
}
```

- [ ] **Step 2: Verify POST handler compiles**

```bash
npx tsc --noEmit 2>&1 | grep "chat/route" | head -20
```

Expected: no errors for `chat/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/books/[id]/chat/route.ts src/modules/chat/model.ts
git commit -m "feat: add POST /api/books/[id]/chat streaming route"
```

---

## Task 4: GET /api/books/[id]/chat — Session Fetch

**Files:**
- Modify: `src/app/api/books/[id]/chat/route.ts` (append the GET handler)

- [ ] **Step 1: Append GET handler to the existing route file**

Add this after the `POST` function in `src/app/api/books/[id]/chat/route.ts`:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id: _bookId } = await params;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId required" }), { status: 400 });
  }

  await connectToDatabase();

  const session = await ChatSessionModel.findById(sessionId).lean();
  if (!session) {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
  }
  if ((session as { userId: string }).userId !== userId) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }

  const storedMessages = (session as { messages: { id: string; role: string; content: string; reasoning?: string | null; toolCalls?: { toolName: string; args: unknown }[] }[] }).messages ?? [];

  // Convert stored messages to AI SDK UIMessage format
  const uiMessages = storedMessages.map((m) => ({
    id: m.id ?? crypto.randomUUID(),
    role: m.role as "user" | "assistant",
    content: m.content,
    ...(m.reasoning ? { annotations: [{ type: "reasoning", content: m.reasoning }] } : {}),
  }));

  return Response.json({ sessionId: sessionId.toString(), messages: uiMessages });
}
```

- [ ] **Step 2: Verify the full route file compiles**

```bash
npx tsc --noEmit 2>&1 | grep "chat/route" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/books/[id]/chat/route.ts
git commit -m "feat: add GET /api/books/[id]/chat session fetch handler"
```

---

## Task 5: ChatWelcome Component

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/chat-welcome.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(preview)/preview/[id]/_components/chat-welcome.tsx
"use client";

import { MessageCircleMore } from "lucide-react";

interface ChatWelcomeProps {
  bookTitle: string;
  onSuggest: (text: string) => void;
}

const SUGGESTIONS = [
  "What is this book about?",
  "Who are the main characters / key figures?",
  "Summarise the first chapter",
];

export function ChatWelcome({ bookTitle, onSuggest }: ChatWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircleMore className="size-6" />
      </div>
      <div>
        <p className="text-sm font-semibold">Ask anything about</p>
        <p className="text-sm font-semibold text-primary">{bookTitle}</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            onClick={() => onSuggest(text)}
            className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "chat-welcome" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/chat-welcome.tsx
git commit -m "feat: add ChatWelcome component with suggestion chips"
```

---

## Task 6: ChatInput Component

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/chat-input.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(preview)/preview/[id]/_components/chat-input.tsx
"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        const fakeEvent = new Event("submit", { bubbles: true, cancelable: true });
        e.currentTarget.form?.dispatchEvent(fakeEvent);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
      <Textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about this book…"
        rows={1}
        className="resize-none overflow-y-auto max-h-[120px] flex-1 text-sm"
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="icon"
        className="size-9 shrink-0"
        disabled={isLoading || !input.trim()}
      >
        <ArrowUp className="size-4" />
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "chat-input" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/chat-input.tsx
git commit -m "feat: add ChatInput component with Enter-to-submit"
```

---

## Task 7: ReasoningBlock Component

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/reasoning-block.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(preview)/preview/[id]/_components/reasoning-block.tsx
"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

interface ReasoningBlockProps {
  reasoning: string;
}

export function ReasoningBlock({ reasoning }: ReasoningBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-2">
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
        <ChevronRight
          className={`size-3 transition-transform ${open ? "rotate-90" : ""}`}
        />
        Thinking…
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
          {reasoning}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "reasoning-block" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/reasoning-block.tsx
git commit -m "feat: add ReasoningBlock collapsible think component"
```

---

## Task 8: GoToPageToolCall Component

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/go-to-page-tool-call.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(preview)/preview/[id]/_components/go-to-page-tool-call.tsx
"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";

interface GoToPageToolCallProps {
  page: number;
  state: "partial-call" | "call" | "result";
  onPageChange: (page: number) => void;
}

export function GoToPageToolCall({ page, state, onPageChange }: GoToPageToolCallProps) {
  const [navigated, setNavigated] = useState(false);

  function handleClick() {
    onPageChange(page);
    setNavigated(true);
  }

  // In the AI SDK, go_to_page has no server execute, so it never reaches 'result'.
  // state will be 'partial-call' during streaming, then 'call' permanently.
  const isPending = state === "partial-call" || (state === "call" && !navigated);

  if (isPending && state === "partial-call") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Going to page {page}…
      </span>
    );
  }

  if (navigated || state === "call") {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {navigated ? (
          <CheckCircle className="size-3 text-green-500" />
        ) : (
          <BookOpen className="size-3" />
        )}
        Page {page}
      </button>
    );
  }

  return null;
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "go-to-page" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/go-to-page-tool-call.tsx
git commit -m "feat: add GoToPageToolCall badge component"
```

---

## Task 9: ChatMessage Component

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/chat-message.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(preview)/preview/[id]/_components/chat-message.tsx
"use client";

import type { Message } from "ai/react";
import Markdown from "react-markdown";

import { ReasoningBlock } from "./reasoning-block";
import { GoToPageToolCall } from "./go-to-page-tool-call";

interface ChatMessageProps {
  message: Message;
  onPageChange: (page: number) => void;
}

type Annotation = { type: string; content: string };

export function ChatMessage({ message, onPageChange }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-muted px-3 py-2 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  // Extract reasoning from annotations
  const annotations = (message.annotations ?? []) as Annotation[];
  const reasoningAnnotation = annotations.find((a) => a.type === "reasoning");
  const reasoning = reasoningAnnotation?.content;

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-1">
        {reasoning && <ReasoningBlock reasoning={reasoning} />}

        <div className="prose prose-sm dark:prose-invert text-sm">
          <Markdown>{message.content}</Markdown>
        </div>

        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {message.toolInvocations.map((inv, i) => {
              if (inv.toolName === "go_to_page") {
                const page = (inv.args as { page: number }).page;
                return (
                  <GoToPageToolCall
                    key={i}
                    page={page}
                    state={inv.state}
                    onPageChange={onPageChange}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "chat-message\b" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/chat-message.tsx
git commit -m "feat: add ChatMessage component with markdown and tool invocations"
```

---

## Task 10: ChatMessageList Component

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/chat-message-list.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/app/(preview)/preview/[id]/_components/chat-message-list.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Message } from "ai/react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { ChatMessage } from "./chat-message";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function ChatMessageList({ messages, isLoading, onPageChange }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessage?.content]);

  // Show skeleton when loading and the last message has no content yet
  const showSkeleton = isLoading && (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content);

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4 px-4 py-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onPageChange={onPageChange}
          />
        ))}
        {showSkeleton && (
          <div className="flex justify-start">
            <div className="w-48 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "chat-message-list" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/chat-message-list.tsx
git commit -m "feat: add ChatMessageList with auto-scroll and loading skeleton"
```

---

## Task 11: ChatPanel — Full Replacement (Orchestrator)

**Files:**
- Modify: `src/app/(preview)/preview/[id]/_components/chat-panel.tsx`

- [ ] **Step 1: Replace entire file with the orchestrator**

```typescript
// src/app/(preview)/preview/[id]/_components/chat-panel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import type { Message } from "ai/react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Book } from "@/types/book";

import { ChatWelcome } from "./chat-welcome";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

interface ChatPanelProps {
  book: Book;
  currentPage: number;
  numPages: number | null;
  onPageChange: (page: number) => void;
}

const SESSION_KEY = (bookId: string) => `chat_session_${bookId}`;

type Annotation = { type: string; content: string };

export function ChatPanel({ book, numPages, onPageChange }: ChatPanelProps) {
  const sessionIdRef = useRef<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [initialised, setInitialised] = useState(false);

  // On mount: attempt to restore previous session
  useEffect(() => {
    const storedId = localStorage.getItem(SESSION_KEY(book.id));
    if (!storedId) {
      setInitialised(true);
      return;
    }
    sessionIdRef.current = storedId;

    fetch(`/api/books/${book.id}/chat?sessionId=${storedId}`)
      .then((res) => {
        if (res.status === 404 || res.status === 403) {
          localStorage.removeItem(SESSION_KEY(book.id));
          sessionIdRef.current = null;
          return null;
        }
        return res.json();
      })
      .then((data: { messages: Message[] } | null) => {
        if (data?.messages) {
          setInitialMessages(data.messages);
        }
      })
      .catch(() => {
        // silently ignore — start fresh
      })
      .finally(() => setInitialised(true));
  }, [book.id]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append, error, reload } =
    useChat({
      api: `/api/books/${book.id}/chat`,
      initialMessages,
      onToolCall({ toolCall }) {
        if (toolCall.toolName === "go_to_page") {
          const raw = (toolCall.args as { page: number }).page;
          const page = Math.max(1, Math.min(raw, numPages ?? Infinity));
          onPageChange(page);
        }
      },
      onFinish(message) {
        // Read sessionId annotation from the first assistant response
        if (!sessionIdRef.current) {
          const annotations = (message.annotations ?? []) as Annotation[];
          const sessionAnnotation = annotations.find((a) => a.type === "sessionId");
          if (sessionAnnotation?.content) {
            sessionIdRef.current = sessionAnnotation.content;
            localStorage.setItem(SESSION_KEY(book.id), sessionAnnotation.content);
          }
        }
      },
    });

  function handleNewChat() {
    localStorage.removeItem(SESSION_KEY(book.id));
    sessionIdRef.current = null;
    setMessages([]);
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    handleSubmit(e, { body: { sessionId: sessionIdRef.current } });
  }

  if (!initialised) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Chat</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={handleNewChat}
        >
          <RotateCcw className="size-3" />
          New chat
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span>
            {error.message?.includes("book_not_ready")
              ? "This book is still processing. Try again shortly."
              : error.message?.includes("Unauthorized") || error.message?.includes("401")
              ? "Please sign in to chat."
              : "Something went wrong. Try again."}
          </span>
          {!error.message?.includes("401") && !error.message?.includes("book_not_ready") && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => reload()}>
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Body */}
      {messages.length === 0 ? (
        <ChatWelcome
          bookTitle={book.title}
          onSuggest={(text) => {
            append(
              { role: "user", content: text },
              { body: { sessionId: sessionIdRef.current } }
            );
          }}
        />
      ) : (
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      )}

      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={(v) => handleInputChange({ target: { value: v } } as React.ChangeEvent<HTMLTextAreaElement>)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "chat-panel" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/chat-panel.tsx
git commit -m "feat: replace ChatPanel placeholder with full useChat orchestrator"
```

---

## Task 12: Update SidePanel — Add numPages + onPageChange Props

**Files:**
- Modify: `src/app/(preview)/preview/[id]/_components/side-panel.tsx`

- [ ] **Step 1: Update SidePanel to accept and thread the new props**

Replace the entire file content:

```typescript
// src/app/(preview)/preview/[id]/_components/side-panel.tsx
"use client";

import { Info, MessageCircle, Mic } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Book } from "@/types/book";

import { ChatPanel } from "./chat-panel";
import { VoicePanel } from "./voice-panel";

interface SidePanelProps {
  book: Book;
  currentPage: number;
  numPages: number | null;
  onPageChange: (page: number) => void;
}

export function SidePanel({ book, currentPage, numPages, onPageChange }: SidePanelProps) {
  return (
    <Tabs defaultValue="chat" className="flex h-full flex-col bg-card">
      <div className="flex flex-col gap-3 py-3">
        <div className="flex justify-center">
          <TabsList className="rounded-full">
            <TabsTrigger
              value="summary"
              className="rounded-full py-1 px-4 text-sm"
            >
              <Info className="size-3" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-full py-1 px-4 text-sm"
            >
              <MessageCircle className="size-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="rounded-full py-1 px-4 text-sm"
            >
              <Mic className="size-3" />
              Voice
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="chat" className="flex-1 overflow-hidden">
        <ChatPanel
          book={book}
          currentPage={currentPage}
          numPages={numPages}
          onPageChange={onPageChange}
        />
      </TabsContent>
      <TabsContent value="voice" className="overflow-hidden">
        <VoicePanel book={book} />
      </TabsContent>
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify compile**

```bash
npx tsc --noEmit 2>&1 | grep "side-panel" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/side-panel.tsx
git commit -m "feat: thread numPages and onPageChange through SidePanel"
```

---

## Task 13: Update PreviewShell — Thread Props to Both SidePanel Usages

**Files:**
- Modify: `src/app/(preview)/preview/[id]/_components/preview-shell.tsx`

- [ ] **Step 1: Add numPages + onPageChange to both SidePanel usages**

Replace the entire file content:

```typescript
// src/app/(preview)/preview/[id]/_components/preview-shell.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Book } from "@/types/book";

import { PreviewPdfPanel } from "./preview-pdf-panel";
import { SidePanel } from "./side-panel";

interface PreviewShellProps {
  book: Book;
}

export function PreviewShell({ book }: PreviewShellProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Thin top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-card/80 px-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href={`/book/${book.id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <span className="max-w-[140px] truncate text-sm font-semibold sm:max-w-[400px]">
              {book.title}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              by {book.author}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            Page {currentPage}
            {numPages ? ` of ${numPages}` : ""}
          </span>

          {/* Mobile chat/voice sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8 md:hidden"
              >
                <MessageCircle className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 rounded-t-2xl p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Chat & Voice</SheetTitle>
              </SheetHeader>
              <div className="mx-auto my-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
              <div className="flex-1 overflow-hidden">
                <SidePanel
                  book={book}
                  currentPage={currentPage}
                  numPages={numPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main layout */}
      <div className="grid flex-1 overflow-hidden md:grid-cols-2">
        {/* PDF panel — full width on mobile */}
        <div className="overflow-hidden md:border-r">
          <PreviewPdfPanel
            bookId={book.id}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onNumPagesChange={setNumPages}
          />
        </div>

        {/* Side panel — desktop only */}
        <div className="hidden overflow-hidden md:block">
          <SidePanel
            book={book}
            currentPage={currentPage}
            numPages={numPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Full type-check across the whole project**

```bash
npx tsc --noEmit 2>&1
```

Expected: zero errors (or only pre-existing unrelated errors).

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/preview-shell.tsx
git commit -m "feat: thread numPages and onPageChange into both SidePanel usages in PreviewShell"
```

---

## Task 14: End-to-End Verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: server starts on port 3001 with no build errors.

- [ ] **Step 2: Verify ESLint is clean**

```bash
npm run lint
```

Expected: no new errors.

- [ ] **Step 3: Manual smoke test — happy path**

1. Open a book that has `status: "READY"` in the preview route (`/preview/{id}`)
2. The Chat tab should show the `ChatWelcome` screen with 3 suggestion chips
3. Click a suggestion chip — the message should appear and a streaming response should begin
4. The assistant reply should stream in with markdown rendering
5. If the AI calls `go_to_page`, the PDF panel should navigate to that page and the `GoToPageToolCall` badge should appear
6. Open browser DevTools → Network → filter `chat` → verify the POST returns a streaming response
7. Reload the page — the chat history should be restored from localStorage + GET endpoint
8. Click "New chat" — the session should clear and the welcome screen should reappear

- [ ] **Step 4: Manual smoke test — error states**

1. Open a book with `status: "PROCESSING"` — the assistant banner should say "This book is still processing."
2. Sign out and try to send a message — should show "Please sign in to chat."

- [ ] **Step 5: Final commit**

```bash
git add -p  # stage any remaining changes
git commit -m "feat: complete AI chat module end-to-end"
```

---

## Self-Review Against Spec

| Spec Requirement | Covered By |
|---|---|
| `POST /api/books/[id]/chat` — auth, session load/create, RAG, streamText | Task 3 |
| `GET /api/books/[id]/chat` — session fetch with auth/authz | Task 4 |
| `go_to_page` tool — server declaration, client handler | Task 3 (server), Task 11 (client `onToolCall`) |
| `maxDuration = 30` export | Task 3 |
| `StreamData` reasoning + sessionId annotations | Task 3 `onFinish` |
| `<think>` tag extraction and stripping | Task 3 `onFinish` |
| MongoDB `ChatSession` model + TTL | Task 2 |
| `ChatPanel` props: `numPages`, `onPageChange` | Task 11 |
| `localStorage` session persistence | Task 11 |
| `useRef` for sessionId (no re-render) | Task 11 |
| `handleSubmit` with `body: { sessionId }` | Task 11 |
| Session restore on mount (404/403 → clear + start fresh) | Task 11 |
| "New chat" button | Task 11 |
| `ChatWelcome` with 3 chips | Task 5 |
| `ChatMessageList` with auto-scroll | Task 10 |
| `ChatMessage` — user pill, assistant markdown | Task 9 |
| `ReasoningBlock` collapsible (shadcn Collapsible, collapsed by default) | Task 7 |
| `GoToPageToolCall` — partial-call spinner, call+navigated check mark | Task 8 |
| `ChatInput` — Enter submit, Shift+Enter newline, loading skeleton | Task 6, 10 |
| `SidePanel` updated props | Task 12 |
| `PreviewShell` updated — both desktop + mobile Sheet | Task 13 |
| Error banners: 401, 400 book_not_ready, 500 + retry | Task 11 |
| Page clamp to `[1, numPages]` | Task 11 `onToolCall` |
