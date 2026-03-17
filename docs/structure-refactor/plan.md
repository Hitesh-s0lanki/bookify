# Structure Refactor Plan

## Goal

Align the Bookfy project structure with the frontend-dev skill's canonical folder layout.

---

## Changes

### 1. Update Middleware Route Matcher

- **File:** `src/proxy.ts` (keep filename as-is)
- **Update** route matcher from `/books(.*)` to `/(protected)(.*)`
- **Why:** Should match the `(protected)` route group pattern, not a specific route

### 2. Move Book Detail into Route Group

- **Move** `src/app/book/[id]/` → `src/app/(public)/book/[id]/`
- **Why:** All pages should live inside a route group `(public)`, `(protected)`, or `(auth)`
- **Impacted files:**
  - `src/app/book/[id]/page.tsx`
  - `src/app/book/[id]/book-detail-content.tsx`
  - `src/app/book/[id]/_components/book-viewer.tsx`
  - `src/app/book/[id]/_components/book-metadata.tsx`
  - `src/app/book/[id]/_components/pdf-viewer.tsx`
  - `src/app/book/[id]/_components/pdf-viewer-inner.tsx`

### 3. Move Hook out of `_components/`

- **Move** `src/app/(public)/_components/use-library-books.ts` → `src/hooks/use-library-books.ts`
- **Update** import in `src/app/(public)/_components/library-content.tsx` (or wherever it's used)
- **Why:** Hooks belong in `src/hooks/`, not co-located in `_components/`

### 4. Move Custom Component out of `ui/`

- **Move** `src/components/ui/status-badge.tsx` → `src/components/status-badge.tsx`
- **Update** all imports
- **Why:** `components/ui/` is reserved for shadcn primitives; `StatusBadge` is app-specific

### 5. Organize `src/lib/` — Create `lib/api/`

- **Create** `src/lib/api/` folder
- **Move** external service wrappers:
  - `src/lib/s3.ts` → `src/lib/api/s3.ts`
  - `src/lib/gemini.ts` → `src/lib/api/gemini.ts`
  - `src/lib/vapi.ts` → `src/lib/api/vapi.ts`
  - `src/lib/embeddings.ts` → `src/lib/api/embeddings.ts`
- **Keep** in `src/lib/` (utilities, not external APIs):
  - `utils.ts`, `db.ts`, `neon-db.ts`, `pdf.ts`, `chunker.ts`, `ai-response.ts`, `vector-store.ts`, `vector-search.ts`, `inngest.ts`
- **Update** all imports across the codebase

### 6. Move `src/inngest/` → `src/lib/inngest/`

- **Move** `src/inngest/client.ts` → `src/lib/inngest/client.ts`
- **Move** `src/inngest/functions.ts` → `src/lib/inngest/functions.ts`
- **Move** `src/inngest/process-book-direct.ts` → `src/lib/inngest/process-book-direct.ts`
- **Update** all imports (e.g., `src/app/api/inngest/route.ts`, `src/lib/inngest.ts`)
- **Why:** Canonical structure has no `inngest/` at src root

### 7. Move `src/models/` into `src/modules/books/`

- **Move** `src/models/book.ts` → `src/modules/books/model.ts`
- **Update** all imports referencing `@/models/book`
- **Why:** Domain models belong inside their feature module

### 8. Move `src/constants/` into Modules

- **Move** `src/constants/voice-personas.ts` → `src/modules/books/constants.ts`
- **Move** `src/constants/mock-books.ts` → `src/modules/books/mock-data.ts`
- **Update** all imports
- **Why:** Constants are domain-specific, should live in their module

### 9. Complete `modules/books/` Structure

- **Create** `src/modules/books/schema.ts` — extract Zod schemas from `api/book/create/route.ts`
- **Create** `src/modules/books/types.ts` — move `src/types/book.ts` content here
- **Keep** `src/types/book.ts` as a re-export for backward compat (or update all imports)
- **Existing:** `src/modules/books/actions/book.ts` stays

### 10. Extract `providers.tsx`

- **Create** `src/app/providers.tsx` — extract `ClerkProvider` from root layout
- **Update** `src/app/layout.tsx` to use `<Providers>`
- **Why:** Canonical structure separates provider composition

### 11. Normalize API Routes

- **Rename** `src/app/api/book/` → consolidate under `src/app/api/books/`
  - `api/book/create/route.ts` → `api/books/create/route.ts`
  - `api/book/[id]/route.ts` → `api/books/[id]/route.ts`
  - `api/book/extract-metadata/route.ts` → `api/books/extract-metadata/route.ts`
  - `api/book/query/route.ts` → `api/books/query/route.ts`
- **Update** all fetch calls in client components
- **Why:** Consistent plural naming convention

---

## Impacted Files (Import Updates)

After moves, these files will need import path updates:

- `src/app/api/books/route.ts` — imports `@/lib/db`, `@/models/book`
- `src/app/api/book/create/route.ts` — imports `@/lib/db`, `@/lib/inngest`, `@/lib/s3`, `@/models/book`
- `src/app/api/book/[id]/route.ts` — imports `@/models/book`
- `src/app/api/book/extract-metadata/route.ts`
- `src/app/api/book/query/route.ts`
- `src/app/api/inngest/route.ts` — imports from `@/inngest/`
- `src/modules/books/actions/book.ts` — imports `@/constants/voice-personas`, `@/models/book`
- `src/app/(public)/_components/book-card.tsx` — may import `StatusBadge`
- `src/app/(public)/_components/library-content.tsx` — imports `use-library-books`
- `src/app/book/[id]/book-detail-content.tsx` — fetch URL `/api/book/`
- `src/inngest/functions.ts` / `process-book-direct.ts` — imports from `@/lib/`
- `src/lib/inngest.ts` — imports from `@/inngest/client`

---

## Execution Order

1. Middleware fix (independent, critical)
2. Move book detail into route group (independent)
3. Move hook to `src/hooks/` (independent)
4. Move status-badge out of `ui/` (independent)
5. Organize `lib/api/` (independent)
6. Move `inngest/` → `lib/inngest/` (independent)
7. Move `models/` + `constants/` into `modules/books/` (depends on 6)
8. Complete modules structure (depends on 7)
9. Extract providers.tsx (independent)
10. Normalize API routes (do last — touches client fetch URLs)

Steps 1-6 and 9 can be done in parallel. Steps 7-8 sequentially. Step 10 last.

---

## Risk Assessment

- **Low risk:** File moves + import updates are mechanical
- **Medium risk:** API route renaming changes client-side fetch URLs — need to update all `fetch("/api/book/...")` calls
- **No behavior changes** — pure structural refactor
