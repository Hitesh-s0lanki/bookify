# Vapi Voice Chat Integration — Design Spec

**Date:** 2026-03-29
**Branch:** features/ai-chat
**Status:** Approved

---

## Overview

Replace the placeholder `VoicePanel` ("coming soon") in `/preview/[id]` with a fully working Vapi-powered voice chat. The user can speak to an AI assistant trained on the book, see a live waveform visualizer, read a real-time transcript, and have the PDF viewer navigate to pages the assistant references.

---

## Environment Variables Required

```env
# Server-side (already in use by createVapiAssistant)
VAPI_API_KEY=...

# Browser-safe public key — from Vapi Dashboard → Settings → API Keys
NEXT_PUBLIC_VAPI_PUBLIC_KEY=...

# ElevenLabs voice IDs — one per persona (from Vapi Voice Library or ElevenLabs)
VAPI_VOICE_ID_MALE_PROFESSIONAL=...
VAPI_VOICE_ID_FEMALE_FRIENDLY=...
VAPI_VOICE_ID_MALE_SOFT=...
VAPI_VOICE_ID_FEMALE_DEEP=...
```

### What to set up in Vapi Dashboard
1. **Settings → API Keys** → copy the **Public Key** → `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
2. Existing assistants are already created via API — no manual dashboard assistant setup needed
3. **Voice IDs** — go to Vapi Voice Library, choose 4 voices (one per persona), copy IDs into the `VAPI_VOICE_ID_*` env vars

---

## Package

Install `@vapi-ai/web` (Vapi browser SDK).

---

## Data & API Layer

### 1. Book type — expose `vapiAssistantId`

Add `vapiAssistantId?: string` to `src/modules/books/types.ts` and include it in the `GET /api/books/[id]` response. It is a non-sensitive UUID.

### 2. VoiceSession model

New file: `src/modules/voice/model.ts`

```ts
{
  bookId: string,        // ref to Book
  userId: string,        // Clerk userId
  messages: [
    { role: "user" | "assistant", text: string, timestamp: Date }
  ],
  createdAt: Date
}
```

### 3. Voice sessions API

- `POST /api/books/[id]/voice-sessions` — authenticated, accepts `{ messages }`, persists transcript
- `GET  /api/books/[id]/voice-sessions` — authenticated, returns list of past sessions for this book+user

---

## Client Component Architecture

All files live in `src/app/(preview)/preview/[id]/_components/`.

### `voice-panel.tsx` (orchestrator)

- Holds call state: `idle | connecting | active | ended`
- Initialises `@vapi-ai/web` once via `useRef`
- Receives `book`, `numPages`, `onPageChange` props
- Manages transcript array in state
- Wires all Vapi event listeners (see Call Lifecycle below)

### `voice-call-idle.tsx`

Shown when state is `idle` or `ended`. Displays:
- Book cover image
- Persona badge (e.g. "Female - Friendly")
- "Start Voice Chat" button (or "Start new call" after ended)
- When `ended`: the transcript from the just-finished call is shown read-only above the button (no DB fetch — uses the in-memory transcript state)

### `voice-waveform.tsx`

- 7 vertical bars
- Driven by Vapi `volume-level` event (~10 events/sec, value 0–1)
- Bar heights scale proportionally to volume
- CSS pulse animation fallback when volume is 0 (assistant thinking)

### `voice-transcript.tsx`

- Scrollable list of `{ role, text }` entries
- Appended in real-time from Vapi `message` events (`transcriptType: "final"`)
- User messages right-aligned, assistant messages left-aligned (mirrors chat style)
- Auto-scrolls to bottom on new entry

### `voice-call-controls.tsx`

- Shown only during `active` state
- Mute/unmute toggle button
- End call button

---

## Call Lifecycle

```
Start button clicked
  → vapi.start(book.vapiAssistantId, { assistantOverrides })
  → state = "connecting"

"call-start" event
  → state = "active"

"volume-level" event (value: 0–1)
  → update waveform bar heights

"message" event (transcriptType: "final")
  → append { role, text } to transcript

"function-call" event (name: "go_to_page")
  → clamp page to [1, numPages]
  → call onPageChange(page)

"call-end" event
  → POST transcript to /api/books/[id]/voice-sessions
  → state = "ended"

"error" event
  → toast.error(...)
  → state = "idle"
```

---

## `go_to_page` Tool — Assistant Overrides

Injected per-call via `assistantOverrides` so no existing assistant records need updating:

```ts
vapi.start(book.vapiAssistantId, {
  assistantOverrides: {
    model: {
      tools: [
        {
          type: "function",
          function: {
            name: "go_to_page",
            description: "Navigate the PDF viewer to a specific page number",
            parameters: {
              type: "object",
              properties: {
                page: { type: "number", description: "1-based page number" }
              },
              required: ["page"]
            }
          }
        }
      ]
    }
  }
});
```

Client handles the result entirely — no server webhook needed.

---

## Updates to Existing Code

| File | Change |
|---|---|
| `src/modules/books/types.ts` | Add `vapiAssistantId?: string` |
| `src/app/api/books/[id]/route.ts` | Include `vapiAssistantId` in response |
| `src/lib/api/vapi.ts` | Update system prompt to mention `go_to_page` |
| `src/app/(preview)/preview/[id]/_components/voice-panel.tsx` | Full replacement |
| `src/app/(preview)/preview/[id]/_components/side-panel.tsx` | Pass `numPages` + `onPageChange` to VoicePanel |

---

## Error States

| Condition | Handling |
|---|---|
| `vapiAssistantId` missing on book | Show info message: "Voice not available for this book" |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` not set | SDK init fails → toast error |
| Microphone permission denied | Vapi emits error → toast: "Microphone access required" |
| Network/Vapi error mid-call | toast error, state → `idle`, partial transcript discarded |
| Transcript POST fails | Silent — call already ended, log to console |
