# Vapi Voice Chat Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `VoicePanel` in `/preview/[id]` with a live Vapi voice chat featuring an animated waveform visualizer, real-time transcript, PDF page navigation via `go_to_page`, and transcript persistence to MongoDB.

**Architecture:** The browser uses `@vapi-ai/web` to start a Vapi call directly against the book's pre-created assistant. The `go_to_page` tool is injected per-call via `assistantOverrides` — no existing assistant records need updating. A `transcriptRef` mirrors state so stale-closure-free event handlers can save the transcript directly in the `call-end` event. On call-end the client POSTs the transcript to `POST /api/books/[id]/voice-sessions`, backed by a new `VoiceSession` MongoDB collection mirroring the existing `ChatSession` pattern.

**Tech Stack:** `@vapi-ai/web`, Next.js App Router, Mongoose, Clerk auth (`@clerk/nextjs/server`), Tailwind CSS, shadcn/ui (`Button`, `Badge`), Lucide icons, `sonner` toasts.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `@vapi-ai/web` dependency |
| `src/modules/books/types.ts` | Modify | Add `vapiAssistantId?: string` to `Book` |
| `src/app/api/books/[id]/route.ts` | Modify | Expose `vapiAssistantId` in `toBook()` + GET response |
| `src/lib/api/vapi.ts` | Modify | Add `go_to_page` instruction to assistant system prompt |
| `src/modules/voice/model.ts` | Create | VoiceSession Mongoose model + types |
| `src/app/api/books/[id]/voice-sessions/route.ts` | Create | POST (save transcript) + GET (list sessions) |
| `src/app/(preview)/preview/[id]/_components/voice-waveform.tsx` | Create | 7-bar waveform animated by Vapi `volume-level` events |
| `src/app/(preview)/preview/[id]/_components/voice-transcript.tsx` | Create | Scrollable real-time transcript list |
| `src/app/(preview)/preview/[id]/_components/voice-call-controls.tsx` | Create | Mute toggle + end call button |
| `src/app/(preview)/preview/[id]/_components/voice-call-idle.tsx` | Create | Pre-call and post-call UI with book cover |
| `src/app/(preview)/preview/[id]/_components/voice-panel.tsx` | Replace | Vapi orchestrator: lifecycle, state, event wiring |
| `src/app/(preview)/preview/[id]/_components/side-panel.tsx` | Modify | Forward `numPages` + `onPageChange` to `VoicePanel` |

---

### Task 1: Install `@vapi-ai/web`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npm install @vapi-ai/web
```

Expected output: package added, `package.json` and `package-lock.json` updated.

- [ ] **Step 2: Verify TypeScript can resolve it**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `@vapi-ai/web` (pre-existing errors elsewhere are fine).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @vapi-ai/web"
```

---

### Task 2: Expose `vapiAssistantId` in Book type and API

**Files:**
- Modify: `src/modules/books/types.ts`
- Modify: `src/app/api/books/[id]/route.ts`

- [ ] **Step 1: Add `vapiAssistantId` to the Book interface**

Full replacement for `src/modules/books/types.ts`:

```ts
export type BookStatus = "pending" | "ready" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pdfUrl: string;
  voicePersona?: string;
  vapiAssistantId?: string;
  status: BookStatus;
  createdAt: string;
  /** Optional metadata for detail page */
  description?: string;
  genre?: string;
  tags?: string[];
  failureReason?: string;
}
```

- [ ] **Step 2: Update `toBook()` in `src/app/api/books/[id]/route.ts`**

Update the parameter type and return value of `toBook()`. Replace just this function (leave everything else untouched):

```ts
function toBook(doc: {
  _id: unknown;
  title: string;
  author: string;
  coverUrl?: string;
  pdfUrl: string;
  voicePersona?: string;
  vapiAssistantId?: string;
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
    vapiAssistantId: doc.vapiAssistantId,
    status: normalizedStatus,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    description: doc.description,
    genre: doc.genre,
    tags: doc.tags,
    failureReason: doc.failureReason,
  };
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/books/types.ts src/app/api/books/[id]/route.ts
git commit -m "feat: expose vapiAssistantId in Book type and API response"
```

---

### Task 3: Update Vapi assistant system prompt

**Files:**
- Modify: `src/lib/api/vapi.ts`

- [ ] **Step 1: Add `go_to_page` instruction to the first system message**

In `src/lib/api/vapi.ts`, replace the first `messages` entry inside `createVapiAssistant`:

```ts
{
  role: "system",
  content:
    `You are an expert on the book "${title}". ` +
    "Use the provided context to answer user questions naturally. " +
    "When referencing a specific passage or page, call the go_to_page function to navigate the viewer there.",
},
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/vapi.ts
git commit -m "feat: instruct Vapi assistant to call go_to_page when referencing pages"
```

---

### Task 4: Create VoiceSession Mongoose model

**Files:**
- Create: `src/modules/voice/model.ts`

- [ ] **Step 1: Create the model**

```ts
// src/modules/voice/model.ts
import { model, models, Schema, type InferSchemaType } from "mongoose";

const voiceMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  { _id: false }
);

const voiceSessionSchema = new Schema(
  {
    bookId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messages: [voiceMessageSchema],
  },
  { timestamps: true }
);

// 30-day TTL — matches ChatSession
voiceSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export type VoiceMessage = InferSchemaType<typeof voiceMessageSchema>;
export type VoiceSessionDocument = InferSchemaType<typeof voiceSessionSchema>;

export const VoiceSessionModel =
  models.VoiceSession || model("VoiceSession", voiceSessionSchema);
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/voice/model.ts
git commit -m "feat: add VoiceSession mongoose model"
```

---

### Task 5: Create voice-sessions API route

**Files:**
- Create: `src/app/api/books/[id]/voice-sessions/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/books/[id]/voice-sessions/route.ts
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/books/[id]/voice-sessions/route.ts
git commit -m "feat: add voice-sessions API route (POST save transcript, GET list)"
```

---

### Task 6: Build `voice-waveform.tsx`

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/voice-waveform.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(preview)/preview/[id]/_components/voice-waveform.tsx
"use client";

interface VoiceWaveformProps {
  /** Current volume level from Vapi (0–1). 0 means idle/thinking. */
  volume: number;
  /** True when call-start has fired */
  isActive: boolean;
}

// Multipliers per bar — tallest in the middle, shorter toward edges
const MULTIPLIERS = [0.35, 0.55, 0.75, 1.0, 0.75, 0.55, 0.35];

export function VoiceWaveform({ volume, isActive }: VoiceWaveformProps) {
  return (
    <div className="flex h-12 items-center justify-center gap-1">
      {MULTIPLIERS.map((mult, i) => {
        const heightPercent =
          isActive && volume > 0
            ? Math.max(12, Math.min(100, volume * mult * 100))
            : 12;

        return (
          <div
            key={i}
            className={`w-1.5 rounded-full bg-primary transition-all duration-75 ${
              isActive && volume === 0 ? "animate-pulse" : ""
            }`}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/voice-waveform.tsx
git commit -m "feat: add VoiceWaveform component driven by Vapi volume-level events"
```

---

### Task 7: Build `voice-transcript.tsx`

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/voice-transcript.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(preview)/preview/[id]/_components/voice-transcript.tsx
"use client";

import { useEffect, useRef } from "react";

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface VoiceTranscriptProps {
  entries: TranscriptEntry[];
}

export function VoiceTranscript({ entries }: VoiceTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        Start speaking — transcript will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
      {entries.map((entry, i) => (
        <div
          key={i}
          className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              entry.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {entry.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/voice-transcript.tsx
git commit -m "feat: add VoiceTranscript component with auto-scroll"
```

---

### Task 8: Build `voice-call-controls.tsx`

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/voice-call-controls.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(preview)/preview/[id]/_components/voice-call-controls.tsx
"use client";

import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceCallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
}

export function VoiceCallControls({ isMuted, onToggleMute, onEndCall }: VoiceCallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button
        variant="outline"
        size="icon"
        className="size-10 rounded-full"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </Button>
      <Button
        variant="destructive"
        size="icon"
        className="size-12 rounded-full"
        onClick={onEndCall}
        aria-label="End call"
      >
        <PhoneOff className="size-5" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/voice-call-controls.tsx
git commit -m "feat: add VoiceCallControls (mute + end call)"
```

---

### Task 9: Build `voice-call-idle.tsx`

**Files:**
- Create: `src/app/(preview)/preview/[id]/_components/voice-call-idle.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(preview)/preview/[id]/_components/voice-call-idle.tsx
"use client";

import Image from "next/image";
import { Mic, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/types/book";
import type { TranscriptEntry } from "./voice-transcript";
import { VoiceTranscript } from "./voice-transcript";

interface VoiceCallIdleProps {
  book: Book;
  isConnecting: boolean;
  /** Transcript from the just-ended call — shown read-only, no DB fetch */
  endedTranscript: TranscriptEntry[];
  onStart: () => void;
}

export function VoiceCallIdle({ book, isConnecting, endedTranscript, onStart }: VoiceCallIdleProps) {
  const hasEndedTranscript = endedTranscript.length > 0;

  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-6">
      {hasEndedTranscript ? (
        <div className="flex w-full flex-1 flex-col gap-2 overflow-hidden">
          <p className="text-center text-xs font-medium text-muted-foreground">
            Previous conversation
          </p>
          <div className="flex flex-1 flex-col overflow-hidden">
            <VoiceTranscript entries={endedTranscript} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="relative overflow-hidden rounded-2xl border bg-muted/40 p-2">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                width={140}
                height={200}
                className="rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-[200px] w-[140px] items-center justify-center rounded-xl bg-muted">
                <User className="size-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{book.title}</p>
            <p className="text-xs text-muted-foreground">{book.author}</p>
          </div>
          {book.voicePersona && (
            <Badge variant="secondary" className="text-xs">
              {book.voicePersona}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-4 w-full space-y-2">
        <Button
          className="w-full gap-2 rounded-full"
          onClick={onStart}
          disabled={isConnecting || !book.vapiAssistantId}
        >
          <Mic className="size-4" />
          {isConnecting
            ? "Connecting…"
            : hasEndedTranscript
              ? "Start new call"
              : "Start Voice Chat"}
        </Button>
        {!book.vapiAssistantId && (
          <p className="text-center text-xs text-muted-foreground">
            Voice not available for this book
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/voice-call-idle.tsx
git commit -m "feat: add VoiceCallIdle component (pre-call and post-call UI)"
```

---

### Task 10: Replace `voice-panel.tsx` with full Vapi orchestrator

**Files:**
- Replace: `src/app/(preview)/preview/[id]/_components/voice-panel.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
// src/app/(preview)/preview/[id]/_components/voice-panel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

import type { Book } from "@/types/book";
import type { TranscriptEntry } from "./voice-transcript";
import { VoiceCallIdle } from "./voice-call-idle";
import { VoiceCallControls } from "./voice-call-controls";
import { VoiceWaveform } from "./voice-waveform";
import { VoiceTranscript } from "./voice-transcript";

type CallState = "idle" | "connecting" | "active" | "ended";

interface VoicePanelProps {
  book: Book;
  numPages: number | null;
  onPageChange: (page: number) => void;
}

const GO_TO_PAGE_TOOL = {
  type: "function" as const,
  function: {
    name: "go_to_page",
    description: "Navigate the PDF viewer to a specific page number",
    parameters: {
      type: "object" as const,
      properties: {
        page: { type: "number" as const, description: "1-based page number to navigate to" },
      },
      required: ["page"],
    },
  },
};

export function VoicePanel({ book, numPages, onPageChange }: VoicePanelProps) {
  const vapiRef = useRef<Vapi | null>(null);
  // Refs keep event handlers free of stale closures
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const numPagesRef = useRef(numPages);
  const onPageChangeRef = useRef(onPageChange);
  const bookIdRef = useRef(book.id);

  useEffect(() => { numPagesRef.current = numPages; }, [numPages]);
  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);

  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [endedTranscript, setEndedTranscript] = useState<TranscriptEntry[]>([]);

  // Initialise Vapi once on mount
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setCallState("active"));

    vapi.on("call-end", () => {
      setCallState("ended");
      setVolume(0);

      const saved = transcriptRef.current.slice();
      transcriptRef.current = [];
      setTranscript([]);

      if (saved.length > 0) {
        setEndedTranscript(saved);

        fetch(`/api/books/${bookIdRef.current}/voice-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: saved.map((e) => ({
              role: e.role,
              text: e.text,
              timestamp: e.timestamp.toISOString(),
            })),
          }),
        }).catch((err) => {
          console.error("Failed to save voice transcript", err);
        });
      }
    });

    vapi.on("volume-level", (level: number) => setVolume(level));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on("message", (message: any) => {
      if (
        message?.type === "transcript" &&
        message?.transcriptType === "final" &&
        typeof message?.transcript === "string" &&
        (message?.role === "user" || message?.role === "assistant")
      ) {
        const entry: TranscriptEntry = {
          role: message.role as "user" | "assistant",
          text: message.transcript as string,
          timestamp: new Date(),
        };
        transcriptRef.current = [...transcriptRef.current, entry];
        setTranscript((prev) => [...prev, entry]);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on("function-call", (payload: any) => {
      const fc = payload?.functionCall ?? payload;
      if (fc?.name === "go_to_page" && typeof fc?.parameters?.page === "number") {
        const page = Math.max(1, Math.min(fc.parameters.page, numPagesRef.current ?? Infinity));
        onPageChangeRef.current(page);
      }
    });

    vapi.on("error", (error: Error) => {
      console.error("Vapi error", error);
      const msg = (error?.message ?? "").toLowerCase();
      if (msg.includes("permission") || msg.includes("microphone")) {
        toast.error("Microphone access required to use voice chat.");
      } else {
        toast.error("Voice chat error. Please try again.");
      }
      setCallState("idle");
      setVolume(0);
    });

    return () => {
      vapi.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStart() {
    if (!vapiRef.current || !book.vapiAssistantId) return;
    setCallState("connecting");
    setTranscript([]);
    transcriptRef.current = [];
    setIsMuted(false);
    setVolume(0);
    setEndedTranscript([]);

    vapiRef.current.start(book.vapiAssistantId, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assistantOverrides: { model: { tools: [GO_TO_PAGE_TOOL] } } as any,
    });
  }

  function handleEndCall() {
    vapiRef.current?.stop();
  }

  function handleToggleMute() {
    if (!vapiRef.current) return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  }

  const isActive = callState === "active";
  const showIdle = callState === "idle" || callState === "ended" || callState === "connecting";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Voice</span>
        {isActive && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            Live
          </span>
        )}
      </div>

      {/* Body */}
      {showIdle ? (
        <VoiceCallIdle
          book={book}
          isConnecting={callState === "connecting"}
          endedTranscript={endedTranscript}
          onStart={handleStart}
        />
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-col items-center pt-4 pb-2">
            <VoiceWaveform volume={volume} isActive={isActive} />
          </div>
          <VoiceTranscript entries={transcript} />
          <VoiceCallControls
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onEndCall={handleEndCall}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors (the `any` casts on message/function-call/assistantOverrides are intentional — Vapi's SDK types for these event payloads are not exported).

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/voice-panel.tsx
git commit -m "feat: replace VoicePanel placeholder with full Vapi voice chat orchestrator"
```

---

### Task 11: Update `side-panel.tsx` to wire `numPages` + `onPageChange` into `VoicePanel`

**Files:**
- Modify: `src/app/(preview)/preview/[id]/_components/side-panel.tsx`

- [ ] **Step 1: Pass the props to VoicePanel**

In `src/app/(preview)/preview/[id]/_components/side-panel.tsx`, replace the `VoicePanel` usage inside `TabsContent value="voice"`:

```tsx
<TabsContent value="voice" className="overflow-hidden">
  <VoicePanel book={book} numPages={numPages} onPageChange={onPageChange} />
</TabsContent>
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/side-panel.tsx
git commit -m "feat: forward numPages and onPageChange to VoicePanel"
```

---

### Task 12: Add env vars and smoke test

**Files:**
- Modify: `.env`

- [ ] **Step 1: Add the required env vars**

Open `.env` and add:

```env
# Vapi — get from https://dashboard.vapi.ai → Settings → API Keys
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key_here

# ElevenLabs voice IDs — get from Vapi Voice Library or ElevenLabs dashboard
# Pick one voice per persona, copy the ID
VAPI_VOICE_ID_MALE_PROFESSIONAL=your_voice_id_here
VAPI_VOICE_ID_FEMALE_FRIENDLY=your_voice_id_here
VAPI_VOICE_ID_MALE_SOFT=your_voice_id_here
VAPI_VOICE_ID_FEMALE_DEEP=your_voice_id_here
```

> `VAPI_API_KEY` must already be present (used by `createVapiAssistant` in `src/lib/api/vapi.ts`). Confirm it's set.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 3: Final type-check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Manual smoke test**

1. Open a book's preview page (`/preview/[book-id]` for a book with a `vapiAssistantId` in MongoDB)
2. Click the **Voice** tab
3. Confirm: book cover, persona badge, "Start Voice Chat" button visible
4. Click **Start Voice Chat** — browser asks for microphone permission
5. Allow mic — button shows "Connecting…" briefly, then waveform appears with "Live" indicator
6. Speak a question — confirm user transcript entry appears (right-aligned)
7. Wait for AI response — confirm waveform animates, assistant entry appears (left-aligned)
8. Ask the AI to go to a specific page (e.g. "go to page 5") — confirm PDF viewer navigates there
9. Click the red end-call button — confirm page returns to idle with previous transcript shown and "Start new call" button
10. Open DevTools → Network — confirm `POST /api/books/[book-id]/voice-sessions` was called with the transcript JSON
