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

---

## API

### `POST /api/books/[id]/chat`

Streams an AI response for the given conversation turn.

**Request body:**
```ts
{
  messages: CoreMessage[];   // full conversation history from client
  sessionId?: string;        // omit to start a new session
}
```

**Behaviour:**
1. Authenticate with Clerk; reject unauthenticated requests (401).
2. Load or create a `ChatSession` document in MongoDB.
3. Extract the latest user message text and run vector search (`searchBookChunks`) to retrieve up to 8 relevant chunks.
4. Build a system prompt injecting book metadata (title, author) and retrieved chunks with page numbers.
5. Call `streamText` from `ai` with:
   - Provider: `openai('gpt-4o')`
   - `messages`: full conversation history
   - `tools`: `{ go_to_page }` (client-executed, Zod schema `{ page: z.number().int().min(1) }`)
   - `experimental_streamData`: true — used to send a `reasoning` annotation parsed from `<think>...</think>` blocks in the response
6. In `onFinish`: append the completed assistant message (including any tool calls and reasoning) to the `ChatSession.messages` array in MongoDB.
7. Return `result.toDataStreamResponse()`.

### `GET /api/books/[id]/chat`

Fetch an existing chat session.

**Query params:** `sessionId` (required)

**Returns:** `{ sessionId, messages: Message[] }`

---

## Data Model

### `ChatSession` (MongoDB)

```ts
{
  _id: ObjectId,
  bookId: string,          // book._id as string
  userId: string,          // Clerk userId
  messages: [
    {
      role: 'user' | 'assistant' | 'tool',
      content: string,
      toolCalls?: { toolName: string; args: Record<string, unknown> }[],
      reasoning?: string,
    }
  ],
  createdAt: Date,
  updatedAt: Date,
}
```

Stored in the existing MongoDB instance. Model file: `src/modules/chat/model.ts`.

---

## Components

### `ChatPanel` (`chat-panel.tsx`) — orchestrator

- Receives `book: Book` and `currentPage: number` props (existing interface) plus a new `onPageChange: (page: number) => void` prop threaded down from `PreviewShell`.
- On mount: reads `sessionId` from `localStorage` keyed by `book.id`; fetches existing messages via `GET /api/books/[id]/chat?sessionId=X`.
- Uses `useChat({ api, initialMessages, onToolCall })`.
- `onToolCall`: when `toolName === 'go_to_page'`, calls `onPageChange(args.page)`.
- Renders: `ChatWelcome` (empty state) | `ChatMessageList` | `ChatInput`.
- Header row: book title chip + "New chat" button (clears sessionId, resets messages).

### `ChatMessageList`

- Scrollable `ScrollArea` containing a list of `ChatMessage` components.
- `useEffect` auto-scrolls to bottom ref on `messages` change.

### `ChatMessage`

Renders one message based on `message.role`:

| Role | Appearance |
|---|---|
| `user` | Right-aligned rounded bubble, muted background |
| `assistant` | Left-aligned, renders `content` via `react-markdown` with prose styles; if `message.annotations` contains reasoning, renders `ReasoningBlock` above the content |
| `tool` | Renders `GoToPageToolCall` card |

### `ReasoningBlock`

- HTML `<details>` / shadcn `Collapsible` with `<summary>` label "Thinking…".
- Collapsed by default.
- Body: monospace-ish small text rendering the raw reasoning string.

### `GoToPageToolCall`

- Small pill card: book icon + "Page {n}".
- Shows `Spinner` while tool state is `partial-call` or `call`; `CheckCircle` when `result`.
- Clicking it calls `onPageChange(page)` again as a convenience.

### `ChatInput`

- `Textarea` (auto-resize, max 4 rows).
- Send `Button` (icon-only, disabled while `isLoading`).
- `Enter` submits; `Shift+Enter` inserts newline.
- Shows a subtle "AI is thinking…" skeleton row when `isLoading` and no partial token has arrived yet.

### `ChatWelcome`

- Centered empty state with `MessageCircleMore` icon.
- Subtitle: "Ask anything about {book.title}".
- 3 suggested question chips that call `append()` on click.

---

## Data Flow

```
User types message
  → useChat.handleSubmit()
  → POST /api/books/[id]/chat  { messages, sessionId }
      → vector search (Neon)
      → streamText (OpenAI gpt-4o)
          → stream tokens → client renders assistant bubble
          → stream tool_call go_to_page → client renders GoToPageToolCall + calls onPageChange
          → stream reasoning annotation → ReasoningBlock populated
      → onFinish → MongoDB append
  → useChat updates messages state
  → ChatMessageList auto-scrolls
```

---

## Threading `onPageChange` through the component tree

`PreviewShell` already owns `currentPage` and `setCurrentPage`. The prop chain becomes:

```
PreviewShell
  → SidePanel  (+ onPageChange)
    → ChatPanel (+ onPageChange)
```

`PreviewPdfPanel` already receives `currentPage` so navigating updates the PDF viewer.

---

## Error Handling

- Network / stream error: `useChat` exposes `error` state — render an inline error banner with a retry button.
- Book not ready (no vector chunks): API returns 400; client shows "This book hasn't finished processing yet."
- Rate limit / OpenAI error: 500 with descriptive message rendered in chat.

---

## Out of Scope

- Message editing / deletion
- Multi-session listing / history browser
- Streaming voice read-aloud of answers
- Tool calls beyond `go_to_page`
