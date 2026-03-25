# AI Chat Interface Design

**Date:** 2026-03-25
**Feature:** Full AI chat panel for the book preview page
**Status:** Approved

---

## Overview

Replace the `ChatPanel` placeholder with a complete streaming AI chat interface that lets users ask questions about the book they are reading. The AI answers using RAG (retrieval-augmented generation) over the book's vector chunks, can navigate the PDF viewer to relevant pages via a tool call, shows its reasoning in a collapsible block, and persists conversation history to MongoDB.

---

## Tech Stack Additions

| Package | Purpose |
|---|---|
| `ai` | Vercel AI SDK core — `streamText`, `useChat` |
| `@ai-sdk/openai` | OpenAI provider for `gpt-4o` |

Existing stacks (Gemini, Neon vector search, MongoDB) are unchanged.

**Required environment variable:** `OPENAI_API_KEY` must be added to `.env.local` and any deployment environment. Document this alongside the existing `GEMINI_API_KEY` entry.

---

## API

### `POST /api/books/[id]/chat`

Streams an AI response for the given conversation turn.

**Request body:**
```ts
{
  messages: CoreMessage[];   // full conversation history from client (AI SDK format)
  sessionId?: string;        // omit to create a new session
}
```

**Behaviour:**
1. Authenticate with Clerk (`auth()` from `@clerk/nextjs/server`); return 401 if unauthenticated.
2. Load or create a `ChatSession` document in MongoDB for `(bookId, userId)`.
   - If `sessionId` is provided but the document does not exist or belongs to a different `userId`, return 404.
   - If no `sessionId`, create a new `ChatSession` and include its `_id.toString()` in the response (see step 7).
3. Load the book document from MongoDB and check its status. If `status` is not `'ready'` or `'READY'`, return `400 { error: 'book_not_ready' }`.
4. Extract the latest user message text (last message with `role: 'user'`, `content` as string). Call `generateQueryEmbedding(userMessageText)` from `src/lib/api/embeddings.ts` (Gemini-backed) to get a `number[]`, then pass it as `queryEmbedding` to `searchBookChunks` to retrieve up to 8 relevant chunks from Neon.
5. Build a system prompt:
   ```
   You are an AI assistant helping the user understand the book "{title}" by {author}.
   Use the following excerpts to answer the user's question.
   When referencing a specific passage, call the go_to_page tool to navigate there.

   Before answering, reason step-by-step inside <think>...</think> tags.
   After the closing </think> tag, write your final answer in plain prose.

   Excerpts:
   {chunks formatted as "Page N: <text>"}
   ```
   Note: `<think>` tag reasoning is **prompt-engineered**, not a native model feature. `gpt-4o` will emit the tags as instructed.
6. Create a `StreamData` instance before calling `streamText`:
   ```ts
   const streamData = new StreamData();
   ```
7. Call `streamText` from `ai`:
   - Provider: `openai('gpt-4o')`
   - `messages`: full conversation history from request body
   - `system`: the prompt built in step 4
   - `tools`: `{ go_to_page }` — defined with Zod schema but **no `execute` function** (see Tool Definition below)
   - `maxSteps`: 1 — prevents the server hanging waiting for a tool result that is executed client-side
   - `onFinish`: callback that (a) extracts reasoning, (b) persists to MongoDB, (c) closes `streamData`
8. In `onFinish({ text, toolCalls })`:
   - Parse reasoning: `const reasoningMatch = text.match(/<think>([\s\S]*?)<\/think>/);`
   - Strip `<think>...</think>` from `text` to get the clean answer.
   - Append reasoning annotation if present: `streamData.append({ type: 'reasoning', content: reasoningMatch[1] })`.
   - Append the `sessionId` so the client can persist it: `streamData.append({ type: 'sessionId', content: sessionId })`.
   - Persist the completed turn to MongoDB: append the user message and the assistant message `{ role: 'assistant', content: cleanText, reasoning, toolCalls }` to `ChatSession.messages`.
   - Call `streamData.close()`.
9. Return `result.toDataStreamResponse({ data: streamData })`.

**Streaming timeout:** Export `export const maxDuration = 30;` from the route file to set a 30-second limit (Next.js route segment config).

### `GET /api/books/[id]/chat`

Fetch an existing chat session for the authenticated user.

**Authentication:** Same as POST — return 401 if unauthenticated.

**Query params:** `sessionId` (required)

**Authorisation:** Verify `ChatSession.userId === auth().userId`; return 403 if mismatch, 404 if not found.

**Returns:**
```ts
{
  sessionId: string;
  messages: StoredMessage[];  // from MongoDB — converted to AI SDK UIMessage format before returning
}
```

**Message format conversion:** MongoDB stores `StoredMessage[]` (see Data Model). Before returning, convert each stored message to the `useChat`-compatible `Message` type:
- `{ id: crypto.randomUUID(), role, content }` for user/assistant messages.
- Tool calls within an assistant message are returned as part of `toolInvocations` on that message.

---

## Tool Definition

`go_to_page` is declared server-side but executed **client-side**. On the server, declare it without an `execute` function so `streamText` streams the tool call to the client and does not block waiting for a result:

```ts
import { tool } from 'ai';
import { z } from 'zod';

const goToPageTool = tool({
  description: 'Navigate the PDF viewer to a specific page number.',
  parameters: z.object({
    page: z.number().int().min(1).describe('The 1-based page number to navigate to'),
  }),
  // No execute — client handles this
});
```

On the client, `useChat` is configured with:
```ts
onToolCall({ toolCall }) {
  if (toolCall.toolName === 'go_to_page') {
    const page = Math.max(1, Math.min(toolCall.args.page, numPages ?? Infinity));
    onPageChange(page);
  }
}
```
The page number is clamped to `[1, numPages]` before calling `onPageChange` to guard against out-of-bounds values. `numPages` is already tracked in `PreviewShell` and threaded down as a prop.

---

## Data Model

### `ChatSession` (MongoDB) — `src/modules/chat/model.ts`

```ts
const storedMessageSchema = new Schema({
  id: { type: String, required: true },         // client-side stable id (uuid)
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },    // clean text (no <think> tags)
  reasoning: { type: String, default: null },   // extracted from <think>...</think>
  toolCalls: [{
    toolName: String,
    args: Schema.Types.Mixed,
  }],
}, { _id: false });

const chatSessionSchema = new Schema({
  bookId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  messages: [storedMessageSchema],
}, { timestamps: true });
```

**TTL:** Add `chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 })` (30-day TTL) to prevent unbounded growth.

---

## Components

### `ChatPanel` (`chat-panel.tsx`) — orchestrator

**Props (updated interface):**
```ts
interface ChatPanelProps {
  book: Book;
  currentPage: number;
  numPages: number | null;      // NEW — needed to clamp go_to_page
  onPageChange: (page: number) => void;  // NEW
}
```

**Behaviour:**
- localStorage key: `chat_session_${book.id}` — read on mount to get `sessionId`.
- On mount: if `sessionId` exists, fetch `GET /api/books/[book.id]/chat?sessionId={sessionId}`. On 404/403, clear localStorage and start fresh (do not surface an error to the user).
- Maintain `sessionId` in a `useRef` (mutable, not state) so it is always current without causing re-renders.
- Initialise `useChat` with `{ api: '/api/books/${book.id}/chat', initialMessages, onToolCall }`.
- Pass the current `sessionId` via the `body` option using `handleSubmit(e, { body: { sessionId: sessionIdRef.current } })` at submit time — this ensures the latest value is always sent without re-initialising `useChat`.
- After first assistant response, read `sessionId` from `message.annotations` (type `'sessionId'`) and write to `localStorage` and `sessionIdRef.current` if not already set.
- Renders: `ChatWelcome` (when `messages.length === 0`) | `ChatMessageList` + `ChatInput`.
- Header: "New chat" button — clears `localStorage` key, calls `setMessages([])`, resets local `sessionId` state.

### `ChatMessageList`

- `ScrollArea` wrapping a flex column of `ChatMessage` components.
- `useEffect` with `ref` on a bottom sentinel — scrolls into view whenever `messages` length changes or the last message content changes (handles streaming).

### `ChatMessage`

Renders one `Message` from `useChat`:

| Condition | Appearance |
|---|---|
| `message.role === 'user'` | Right-aligned pill bubble, `bg-muted` |
| `message.role === 'assistant'` | Left-aligned; if reasoning annotation present, render `ReasoningBlock` above the text; render text via `react-markdown` with `prose prose-sm dark:prose-invert` |
| `message.toolInvocations` present | Render `GoToPageToolCall` for each invocation below the text |

### `ReasoningBlock`

- shadcn `Collapsible` (use the existing `src/components/ui/collapsible.tsx`, not raw `<details>`).
- `CollapsibleTrigger`: small muted row "▶ Thinking…" / "▼ Thinking…".
- Collapsed by default (`open={false}`).
- `CollapsibleContent`: `<pre>` tag with `text-xs text-muted-foreground whitespace-pre-wrap` for raw reasoning text.

### `GoToPageToolCall`

- Small `Badge`-style card: `BookOpen` icon + "Page {n}".
- Because `go_to_page` has no server-side `execute` function, the Vercel AI SDK will never produce a `'result'` state for this tool invocation. The invocation remains in `'call'` state permanently.
- Use local component state to track "navigated" status instead:
  - On mount / when `onToolCall` fires, the parent sets a local `navigated` boolean via a callback.
  - `'partial-call'`: show `Spinner` + "Going to page {n}…"
  - `'call'` + not yet navigated: show `Spinner` + "Going to page {n}…"
  - `'call'` + navigated: show `CheckCircle` icon + "Page {n}" — clicking re-triggers `onPageChange(n)`.

### `ChatInput`

- `Textarea` with `rows={1}`, CSS `resize-none`, grows up to `max-h-[120px]` via `overflow-y-auto`.
- Send `Button` (ArrowUp icon, `size="icon"`), disabled when `isLoading || input.trim() === ''`.
- `onKeyDown`: `Enter` without Shift calls `handleSubmit`; `Shift+Enter` allows newline.
- When `isLoading` and `messages` array last entry has no content yet, show a `Skeleton` row (3 lines, `animate-pulse`) as the pending assistant message placeholder.

### `ChatWelcome`

- Centered with `MessageCircleMore` icon (already imported in original file).
- Subtitle: "Ask anything about **{book.title}**".
- 3 static suggested question chips (static is fine for v1):
  - "What is this book about?"
  - "Who are the main characters / key figures?"
  - "Summarise the first chapter"
- Each chip calls `append({ role: 'user', content: chipText })` on click.

---

## Component Tree Changes

The following **existing files** must be modified:

### `SidePanel` (`side-panel.tsx`)

Add `onPageChange` and `numPages` to props and thread to `ChatPanel`:

```ts
interface SidePanelProps {
  book: Book;
  currentPage: number;
  numPages: number | null;       // NEW
  onPageChange: (page: number) => void;  // NEW
}
```

### `PreviewShell` (`preview-shell.tsx`)

Thread `numPages` and `setCurrentPage` (as `onPageChange`) down to both `SidePanel` usages (desktop `div` and mobile `Sheet`):

```tsx
<SidePanel
  book={book}
  currentPage={currentPage}
  numPages={numPages}
  onPageChange={setCurrentPage}
/>
```

Both call sites (desktop + mobile Sheet) must be updated.

---

## Data Flow

```
User types message → Enter
  → useChat.handleSubmit()
  → POST /api/books/[id]/chat  { messages, sessionId }
      → Clerk auth check
      → Load/create ChatSession in MongoDB
      → Vector search (Neon) on latest user message
      → streamText(gpt-4o, system prompt + history, go_to_page tool, maxSteps:1)
          ↓ stream chunks
          → client renders streaming assistant bubble
          ↓ tool_call: go_to_page({ page: N })
          → client: onToolCall → clamp → onPageChange(N) → PDF viewer navigates
          → GoToPageToolCall renders in message
          ↓ onFinish
          → parse <think>...</think> reasoning
          → StreamData.append({ type:'reasoning', content })
          → StreamData.append({ type:'sessionId', content })
          → MongoDB: append user + assistant messages
          → StreamData.close()
  → useChat receives annotations → ChatMessage renders ReasoningBlock
  → sessionId written to localStorage (first turn only)
  → ChatMessageList auto-scrolls to bottom
```

---

## Error Handling

| Scenario | Server | Client |
|---|---|---|
| Unauthenticated | 401 | `useChat` error state → inline banner "Please sign in to chat" |
| Session not found / wrong user | 404/403 | Clear localStorage, start new session silently |
| Book not in ready state (`status !== 'ready'/'READY'`) | 400 `{ error: 'book_not_ready' }` | Banner: "This book is still processing. Try again shortly." |
| OpenAI rate limit / 5xx | 500 | Banner: "Something went wrong. Try again." + retry button calls `reload()` |
| Stream timeout (>30s) | Next.js 504 | Same as above |

---

## Out of Scope

- Message editing / deletion
- Multi-session history browser
- Streaming voice read-aloud of answers
- Tool calls beyond `go_to_page`
- Markdown rendering in `ReasoningBlock` (plain text is sufficient)
