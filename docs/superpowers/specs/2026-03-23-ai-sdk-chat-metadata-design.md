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

```
ai                   # Vercel AI SDK core
@ai-sdk/google       # Google Gemini provider for AI SDK
```

`@google/generative-ai` is **retained** for:
- `src/lib/api/embeddings.ts` — query/chunk embedding generation
- `src/lib/api/gemini.ts` — book cover metadata extraction

### Data Flow

```
User types question
  → useChat() sends POST /api/chat { messages, bookId }
  → Route:
      1. Extract last user message as question
      2. generateQueryEmbedding(question)   ← @google/generative-ai
      3. searchBookChunks({ bookId, ... })  ← pgVector
      4. streamText({ model, system, messages }) ← @ai-sdk/google
      5. toUIMessageStreamResponse({ messageMetadata })
           ├── on 'start':  { createdAt: Date.now(), model: 'gemini-2.0-flash' }
           └── on 'finish': { totalTokens, sources: [...pageNumbers] }
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
export type BookUIMessage = UIMessage<never, MessageMetadata>;
```

---

## Server: `src/lib/chat-stream.ts`

Thin wrapper around `streamText()` from `ai`:
- Accepts `{ question, chunks, messages }`
- Builds system prompt with RAG context (same prompt as current `ai-response.ts`)
- Returns `StreamTextResult` for piping into the route handler
- Model: `google('gemini-2.0-flash')` via `@ai-sdk/google`

---

## Server: `src/app/api/chat/route.ts`

```
POST /api/chat
Body: { messages: UIMessage[], bookId: string }

1. Parse + validate with Zod
2. Extract question = last message with role 'user'
3. generateQueryEmbedding(question)
4. searchBookChunks({ bookId, queryEmbedding, limit: 8 })
5. sources = unique sorted page numbers from chunks
6. streamChatAnswer({ question, chunks, messages })
7. return result.toUIMessageStreamResponse({
     messageMetadata: ({ part }) => {
       if (part.type === 'start') return { createdAt: Date.now(), model }
       if (part.type === 'finish') return { totalTokens: part.totalUsage.totalTokens, sources }
     }
   })
```

`sources` is captured in closure before streaming begins, flushed at `finish`.

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
    body: { bookId: book._id },
  }),
});
```

### UI Sections

1. **Empty state** — icon + "Ask anything about this book" hint, shown when `messages.length === 0`
2. **Message list** — scrollable `div` with `useEffect` auto-scroll to bottom on new messages
   - User messages: right-aligned bubble, `bg-primary text-primary-foreground`
   - Assistant messages: left-aligned bubble, `bg-muted`
   - Streaming indicator: animated dots when last assistant message is still streaming
3. **Message metadata footer** (assistant messages only):
   - Source page chips: `p.{n}` badges, clicking calls `onPageJump(n)`
   - Info line: `{model} · {totalTokens} tokens · {time}` — subtle `text-xs text-muted-foreground`
   - Only rendered when `message.metadata` is present
4. **Input bar**:
   - `Textarea` (auto-resize, Enter to send, Shift+Enter for newline)
   - Send button: disabled when `status !== 'ready'` or input empty
   - Stop button: shown when `status === 'streaming'` or `'submitted'`

---

## Error Handling

- If `bookId` missing or invalid → 400
- If vector search returns 0 chunks → stream a fallback message ("I couldn't find relevant information in this book.")
- If streaming fails → `useChat` exposes `error` state → show inline error banner above input

---

## Environment Variables

No new env vars required. Uses existing `GEMINI_API_KEY` and `GEMINI_QUERY_MODEL`/`GEMINI_MODEL`.

`@ai-sdk/google` reads `GOOGLE_GENERATIVE_AI_API_KEY` by default — will set it equal to `GEMINI_API_KEY` in the route via `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })`.

---

## Testing Checklist

- [ ] Message streams character-by-character (not batched)
- [ ] Metadata appears after stream completes (not during)
- [ ] Source page chips render correctly for multi-page results
- [ ] `onPageJump` fires with correct page number on chip click
- [ ] Stop button aborts the stream
- [ ] Error state renders when API fails
- [ ] Empty state shows before first message
- [ ] Auto-scroll works as messages grow
