# Onboarding, Subscription Gates & Reading Progress — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Introduce a post-signup onboarding flow, a User model in MongoDB, per-plan book access gates (guest/free/pro), reading progress tracking in MongoDB, and a "Continue Reading" section on the home page.

---

## 1. Data Models

### `UserModel` — `src/modules/user/model.ts`

| Field | Type | Notes |
|---|---|---|
| `clerkId` | String | Unique, indexed |
| `email` | String | |
| `name` | String | |
| `plan` | `"free" \| "pro"` | Default: `"free"` |
| `stripeCustomerId` | String | Optional, for future Stripe integration |
| `createdAt / updatedAt` | Date | Mongoose timestamps |

### `ReadingProgressModel` — `src/modules/reading-progress/model.ts`

| Field | Type | Notes |
|---|---|---|
| `userId` | String | Clerk `clerkId`, indexed |
| `bookId` | String | MongoDB ObjectId ref to Book, indexed |
| `currentPage` | Number | Default: 1 |
| `totalPages` | Number | |
| `lastReadAt` | Date | |

Compound unique index on `(userId, bookId)`.

### Guest state (localStorage)

- `bookify_guest_books`: `string[]` — array of opened bookIds, capped at 2
- `bookify_guest_progress`: `{ [bookId]: { page: number, title: string, coverUrl: string } }`

---

## 2. API Routes

### `POST /api/users/onboard`
- Auth: Clerk `auth()` required
- Reads `userId`, `emailAddresses[0]`, `fullName` from Clerk
- If user doc exists by `clerkId` → returns `{ alreadyExists: true }`
- If new → creates `UserModel` with `plan: "free"`
- Called fire-and-forget from the onboarding page

### `GET /api/users/me`
- Returns `{ plan, clerkId, name }` for the current authenticated user
- Used by book-open gates and home page

### `POST /api/reading-progress`
- Body: `{ bookId, currentPage, totalPages }`
- Upserts `ReadingProgressModel` by `(userId, bookId)`
- Called from PDF viewer on page change, debounced 2s

### `GET /api/reading-progress?bookId=xxx`
- Returns saved page for a specific book
- Used on preview page mount to resume reading

### `GET /api/reading-progress/recent`
- Returns last 5 books with progress (`currentPage`, `totalPages`, `lastReadAt`, book metadata)
- Used by "Continue Reading" section on home page

---

## 3. Onboarding Page & Flow

**Route group:** `src/app/(onboarding)/`
- Own layout — no AppShell, no navbar, full-screen centered

**Page:** `src/app/(onboarding)/onboarding/page.tsx`

**Flow:**
1. Clerk `SignUp` component configured with `afterSignUpUrl="/onboarding"`
2. Page renders instantly using Clerk user data (avatar, name)
3. UI: branded splash — avatar + "Welcome, [Name]" + "Setting up your library…" + animated pulse/spinner
4. On mount → `POST /api/users/onboard` (fire-and-forget)
5. If `{ alreadyExists: true }` → redirect to `/onboarding-error`
6. On success → redirect to `/`
7. Visible duration: ~300–500ms (just the DB write roundtrip)

**Error page:** `src/app/(onboarding)/onboarding-error/page.tsx`
Simple centered card: lock icon, "You've already been onboarded", link back to home. No redirect loop.

**Middleware guard:** If authenticated user hits `/onboarding` and already has a `UserModel` doc → redirect to `/` immediately.

---

## 4. Book Access Gates

### Guest (unauthenticated)

- On every book open, check `localStorage` key `bookify_guest_books`
- BookId already in array → allow (resuming)
- Array length < 2 → add bookId, allow
- Array length >= 2 and bookId not in it → show `<GuestLimitModal>`

**`GuestLimitModal`:** "You've read 2 books as a guest. Sign up free to read 5 books." → Sign Up / Log In buttons.

### Free plan (authenticated)

- On book open, call `GET /api/users/me`
- If `plan === "free"`: count distinct `ReadingProgress` records for user
- Count < 5 → allow
- Count >= 5 and this bookId has no progress → show `<UpgradeModal>`

**`UpgradeModal`:** "You've reached your 5-book limit on the Free plan. Upgrade to Pro for unlimited access." → Upgrade to Pro / Maybe Later.

### Pro plan

No gate — always allow.

**Component locations:** `src/components/gates/GuestLimitModal.tsx`, `src/components/gates/UpgradeModal.tsx`

---

## 5. Home Page — "Continue Reading" & Resume

### Continue Reading section

- New `ContinueReadingSection` component in `src/app/(public)/_components/continue-reading-section.tsx`
- Rendered above "Recent Books" in `HomePage` — only when user is authenticated AND has ≥1 progress record
- Calls `GET /api/reading-progress/recent`
- Horizontal scroll row of cards: cover, title, author, progress bar (`currentPage / totalPages`), "Continue Reading" button
- Hidden entirely if no progress records exist

**Guest nudge:** When not authenticated, show a small "Sign up to track your reading progress" banner in place of the section.

### Resume reading (authenticated)

- On `/preview/[id]` mount → `GET /api/reading-progress?bookId=xxx`
- If saved page exists → jump PDF viewer to that page
- Wire `onPageChange` prop (already exists on preview PDF component) to `POST /api/reading-progress`, debounced 2s

### Resume reading (guest)

- On `/preview/[id]` mount → read `bookify_guest_progress[bookId]?.page` from localStorage
- Jump to that page if exists
- Guest "Continue Reading" section not shown on home page

---

## 6. File Structure Summary

```
src/
  app/
    (onboarding)/
      layout.tsx                          # Full-screen, no AppShell
      onboarding/
        page.tsx                          # Branded splash + onboard API call
      onboarding-error/
        page.tsx                          # Already onboarded error page
  modules/
    user/
      model.ts                            # UserModel (Mongoose)
    reading-progress/
      model.ts                            # ReadingProgressModel (Mongoose)
  api/
    users/
      onboard/route.ts
      me/route.ts
    reading-progress/
      route.ts                            # POST upsert + GET by bookId
      recent/route.ts                     # GET last 5
  components/
    gates/
      GuestLimitModal.tsx
      UpgradeModal.tsx
  app/(public)/_components/
    continue-reading-section.tsx
    home-page.tsx                         # Updated to include ContinueReadingSection
```

---

## 7. Stripe Integration (Future)

The `stripeCustomerId` field on `UserModel` and the `plan` field are pre-wired for a future Stripe webhook that sets `plan: "pro"` when a subscription is activated, and reverts to `plan: "free"` on cancellation. No Stripe code is included in this implementation.
