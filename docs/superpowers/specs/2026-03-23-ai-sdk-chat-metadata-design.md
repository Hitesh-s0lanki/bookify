# Design: Vercel AI SDK Chat Interface with Message Metadata

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

Replace the placeholder `ChatPanel` and the non-streaming `/api/books/query` route with a full end-to-end streaming chat interface powered by the Vercel AI SDK (`ai` + `@ai-sdk/google`). Message metadata (timestamps, model name, token usage, source pages) is attached per message using the AI SDK's `messageMetadata` callback and rendered subtly in the UI.

---

## Goals

- Real-time streaming answers in the book preview chat panel
- Per-message metadata: creation timestamp, model name, total tokens used, source page numbers
- Source page chips below assistant messages (clickable to jump to that page in the PDF)
- Streaming indicator (animated dots) while generating
- Stop button during active streaming
- Empty state prompt when no messages exist

---

## Non-Goals

- Voice chat (handled separately via VAPI)
- Conversation persistence (messages are session-only, not saved to DB)
- Embeddings/vision migration — `@google/generative-ai` remains for embeddings and cover extraction

---

## Architecture

### New Dependencies

Install exact versions compatible with Next.js 16.1.6, React 19.2.3, and Zod 4:

```
ai@^4.3.0            # Vercel AI SDK core (requires React 18+, compatible with 19)
@ai-sdk/google@^1.2.0  # Google Gemini provider for AI SDK
```

`@google/generative-ai` is **retained** for:
- `src/lib/api/embeddings.ts` — query/chunk embedding generation
- `src/lib/api/gemini.ts` — book cover metadata extraction

### Data Flow

```
User types question
  → useChat() sends POST /api/chat { messages, bookId }
  → Route:
      1. Parse + validate with Zod (question max 1000 chars, last N=10 messages only)
      2. Extract question = text of last user message part
      3. generateQueryEmbedding(question)   ← @google/generative-ai
      4. searchBookChunks({ bookId, ... })  ← pgVector
      5. If chunks.length === 0: return plain streaming fallback, skip streamText
      6. streamText({ model, system, messages }) ← @ai-sdk/google
      7. toUIMessageStreamResponse({ messageMetadata })
           ├── on 'start':  { createdAt: Date.now(), model: 'gemini-2.0-flash' }
           └── on 'finish': { totalTokens: usage.promptTokens + usage.completionTokens, sources }
  → Client useChat() receives typed stream
  → message.metadata.{ createdAt, model, totalTokens, sources }
```

---

## Files

### New / Replaced

| File | Action | Purpose |
|------|--------|---------|
| `src/types/chat.ts` | Create | `MessageMetadata` Zod schema + `BookUIMessage` type |
| `src/lib/chat-stream.ts` | Create | `streamText()` wrapper with RAG context injection |
| `src/app/api/chat/route.ts` | Create | Streaming POST handler, replaces `/api/books/query` |
| `src/app/(preview)/preview/[id]/_components/chat-panel.tsx` | Replace | Full chat UI using `useChat` |

### Modified

| File | Change |
|------|--------|
| `src/app/(preview)/preview/[id]/_components/side-panel.tsx` | Add `onPageJump?: (page: number) => void` prop, thread through to `ChatPanel` |
| `src/app/(preview)/preview/[id]/_components/preview-shell.tsx` | Pass `onPageJump={(page) => setCurrentPage(page)}` to `SidePanel` in both desktop and mobile usages |

### Deleted

| File | Reason |
|------|--------|
| `src/app/api/books/query/route.ts` | Replaced by `/api/chat` |
| `src/lib/ai-response.ts` | Replaced by `src/lib/chat-stream.ts` |

### Untouched

- `src/lib/api/embeddings.ts`
- `src/lib/api/gemini.ts`
- `src/lib/vector-search.ts`
- `src/lib/vector-store.ts`

---

## Type Definitions (`src/types/chat.ts`)

```ts
import { z } from "zod";
import type { UIMessage } from "ai";

export const messageMetadataSchema = z.object({
  createdAt: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
  sources: z.array(z.number()).optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// TOOLS is `never` — this app does not use Gemini tool-call parts in the chat UI.
// If a tool-call part arrives unexpectedly (e.g. Gemini grounding), it will be
// silently ignored during rendering (filtered out in the parts map). No crash.
export type BookUIMessage = UIMessage<never, MessageMetadata>;
```

---

## Server: `src/lib/chat-stream.ts`

Thin wrapper around `streamText()` from `ai`:
- Accepts `{ question, chunks, messages }`
- Builds system prompt with RAG context (same prompt as current `ai-response.ts`)
- Returns `StreamTextResult` for piping into the route handler
- Model: `createGoogleGenerativeAI({ apiKey })(modelName)` via `@ai-sdk/google`
- Export `maxDuration = 30` on the route for serverless timeout alignment

---

## Server: `src/app/api/chat/route.ts`

```
POST /api/chat
Body: { messages: UIMessage[], bookId: string }

Security: Intentionally unprotected, matching the existing pattern of /api/books/query
          and all other read-only /api/books/* routes in this project. Book content is
          already publicly accessible; no Clerk auth guard is added here.

export const maxDuration = 30; // seconds — aligns with Vercel serverless timeout

1. Parse + validate with Zod:
   - bookId: string, min 1
   - messages: array, min 1
2. Extract question = text content of the last message part where role === 'user'
   - Validate question length ≤ 1000 chars
   - Trim messages to last 10 to cap token spend
3. generateQueryEmbedding(question)
4. searchBookChunks({ bookId, queryEmbedding, limit: 8 })
5. If chunks.length === 0:
   → return a plain UI stream with fallback text
     "I couldn't find relevant information in this book."
   → skip streamText entirely to avoid hallucination on empty context
6. sources = unique sorted page numbers from chunks (captured in closure)
7. streamChatAnswer({ question, chunks, messages })
8. return result.toUIMessageStreamResponse({
     messageMetadata: ({ part }) => {
       if (part.type === 'start') return { createdAt: Date.now(), model: modelName }
       // 'finish' part exposes part.usage.promptTokens + part.usage.completionTokens
       if (part.type === 'finish') return {
         totalTokens: (part.usage?.promptTokens ?? 0) + (part.usage?.completionTokens ?? 0),
         sources,
       }
     }
   })
```

`sources` is captured in closure before `streamText` is called; flushed via metadata at `finish`.

Note: In AI SDK v4, the `finish` stream part exposes `part.usage` (shape: `{ promptTokens, completionTokens }`), **not** `part.totalUsage`. `totalUsage` is a property on the `StreamTextResult` object itself and is not available inside the `messageMetadata` callback. Sum `promptTokens + completionTokens` to derive `totalTokens`.

---

## Client: `src/app/(preview)/preview/[id]/_components/chat-panel.tsx`

### Props

```ts
interface ChatPanelProps {
  book: Book;
  currentPage: number;
  onPageJump?: (page: number) => void;
}
```

### Hook

```ts
const { messages, sendMessage, status, stop } = useChat<never, MessageMetadata>({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { bookId: book.id }, // use book.id (string), not book._id
  }),
});
```

### UI Sections

1. **Empty state** — icon + "Ask anything about this book" hint, shown when `messages.length === 0`
2. **Message list** — scrollable `div` with `useEffect([messages.length])` auto-scroll to bottom
   - User messages: right-aligned bubble, `bg-primary text-primary-foreground`
   - Assistant messages: left-aligned bubble, `bg-muted`
   - Parts rendering: map over `message.parts`, render `part.type === 'text'` only (skip tool-call parts silently)
   - Streaming indicator: animated dots when last assistant message is still streaming (`status === 'streaming'`)
3. **Message metadata footer** (assistant messages only, rendered after `message.metadata` is set):
   - Source page chips: `p.{n}` badges, clicking calls `onPageJump(n)`
   - Info line: `{model} · {totalTokens} tokens · {time}` — `text-xs text-muted-foreground`
   - Only rendered when `message.metadata?.sources` or `message.metadata?.totalTokens` is present
4. **Input bar**:
   - `Textarea` (auto-resize, Enter to send, Shift+Enter for newline)
   - Send button: disabled when `status !== 'ready'` or input is empty
   - Stop button: shown when `status === 'streaming'` or `status === 'submitted'`

---

## Prop Threading (`side-panel.tsx` + `preview-shell.tsx`)

`SidePanel` currently accepts `{ book, currentPage }`. It must be updated to:

```ts
interface SidePanelProps {
  book: Book;
  currentPage: number;
  onPageJump?: (page: number) => void; // new
}
```

`PreviewShell` owns `currentPage` state and `setCurrentPage`. Both the desktop panel and the mobile Sheet usages of `SidePanel` must pass:

```ts
onPageJump={(page) => setCurrentPage(page)}
```

---

## Error Handling

- If `bookId` missing or invalid → 400 JSON response
- If question exceeds 1000 chars → 400 JSON response
- If vector search returns 0 chunks → stream fallback text (no `streamText` call, no hallucination)
- If streaming fails → `useChat` exposes `error` state → show inline error banner above input

---

## Environment Variables

No new env vars required. Uses existing `GEMINI_API_KEY` and `GEMINI_QUERY_MODEL`/`GEMINI_MODEL`.

`@ai-sdk/google` is initialised explicitly via:
```ts
createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
```
This avoids relying on the `GOOGLE_GENERATIVE_AI_API_KEY` default and keeps the existing env var name consistent across the codebase.

---

## Testing Checklist

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
