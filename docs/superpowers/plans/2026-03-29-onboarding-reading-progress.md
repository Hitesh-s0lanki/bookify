# Onboarding, Subscription Gates & Reading Progress — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add post-signup onboarding, a User MongoDB model, per-plan book access gates (guest/free/pro), reading progress tracking in MongoDB, and a "Continue Reading" home page section.

**Architecture:** Option A — separate `UserModel` and `ReadingProgressModel` Mongoose models, dedicated API routes under `/api/users/` and `/api/reading-progress/`, gate modals rendered client-side on the book detail page, progress saves wired into the existing `PreviewShell` via debounced `onPageChange`.

**Tech Stack:** Next.js 16 App Router, React 19, Mongoose (MongoDB), Clerk v7 (`@clerk/nextjs`), Tailwind CSS 4, shadcn/ui, Framer Motion, Zod, Sonner (toasts)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/modules/user/model.ts` | `UserModel` Mongoose schema |
| Create | `src/modules/reading-progress/model.ts` | `ReadingProgressModel` Mongoose schema |
| Create | `src/app/api/users/onboard/route.ts` | POST — create user doc on first sign-up |
| Create | `src/app/api/users/me/route.ts` | GET — return current user plan |
| Create | `src/app/api/reading-progress/route.ts` | POST upsert + GET by bookId |
| Create | `src/app/api/reading-progress/recent/route.ts` | GET last 5 books with progress |
| Create | `src/app/(onboarding)/layout.tsx` | Full-screen layout, no AppShell |
| Create | `src/app/(onboarding)/onboarding/page.tsx` | Branded splash, calls onboard API, redirects |
| Create | `src/app/(onboarding)/onboarding-error/page.tsx` | Already-onboarded error page |
| Create | `src/middleware.ts` | Clerk auth middleware, protect routes |
| Modify | `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Add `afterSignUpUrl="/onboarding"` |
| Create | `src/components/gates/GuestLimitModal.tsx` | Modal for guests hitting 2-book limit |
| Create | `src/components/gates/UpgradeModal.tsx` | Modal for free users hitting 5-book limit |
| Modify | `src/app/(public)/book/[id]/book-detail-content.tsx` | Add access gate logic before allowing preview |
| Modify | `src/app/(preview)/preview/[id]/_components/preview-content.tsx` | Load saved page on mount, pass to shell |
| Modify | `src/app/(preview)/preview/[id]/_components/preview-shell.tsx` | Debounced progress save on page change |
| Create | `src/app/(public)/_components/continue-reading-section.tsx` | "Continue Reading" home section |
| Modify | `src/app/(public)/_components/home-page.tsx` | Add `ContinueReadingSection` above recent books |

---

## Task 1: UserModel

**Files:**
- Create: `src/modules/user/model.ts`

- [ ] **Step 1: Create the file**

```ts
import mongoose, { type InferSchemaType } from "mongoose";

const { model, models, Schema } = mongoose;

const userSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel = models.User || model("User", userSchema);
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```
Expected: no errors related to the new file.

- [ ] **Step 3: Commit**

```bash
git add src/modules/user/model.ts
git commit -m "feat: add UserModel mongoose schema"
```

---

## Task 2: ReadingProgressModel

**Files:**
- Create: `src/modules/reading-progress/model.ts`

- [ ] **Step 1: Create the file**

```ts
import mongoose, { type InferSchemaType } from "mongoose";

const { model, models, Schema } = mongoose;

const readingProgressSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    bookId: {
      type: String,
      required: true,
      index: true,
    },
    currentPage: {
      type: Number,
      required: true,
      default: 1,
    },
    totalPages: {
      type: Number,
      required: true,
      default: 0,
    },
    lastReadAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// Enforce one progress record per user per book
readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export type ReadingProgressDocument = InferSchemaType<typeof readingProgressSchema>;

export const ReadingProgressModel =
  models.ReadingProgress || model("ReadingProgress", readingProgressSchema);
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/reading-progress/model.ts
git commit -m "feat: add ReadingProgressModel mongoose schema"
```

---

## Task 3: POST /api/users/onboard

**Files:**
- Create: `src/app/api/users/onboard/route.ts`

- [ ] **Step 1: Create the file**

```ts
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/modules/user/model";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const existing = await UserModel.findOne({ clerkId: userId }).lean();
    if (existing) {
      return NextResponse.json({ alreadyExists: true });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";
    const name = clerkUser?.fullName ?? clerkUser?.firstName ?? "";

    await UserModel.create({ clerkId: userId, email, name, plan: "free" });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/users/onboard", e);
    return NextResponse.json({ error: "Failed to onboard user" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Smoke test manually**
  - Start dev server: `npm run dev`
  - Sign in as a new user, then hit `POST http://localhost:3001/api/users/onboard` in browser DevTools or Postman
  - First call → `{ success: true }`, second call → `{ alreadyExists: true }`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/users/onboard/route.ts
git commit -m "feat: add POST /api/users/onboard route"
```

---

## Task 4: GET /api/users/me

**Files:**
- Create: `src/app/api/users/me/route.ts`

- [ ] **Step 1: Create the file**

```ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/modules/user/model";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await UserModel.findOne({ clerkId: userId })
      .select("clerkId name plan")
      .lean();

    if (!user) {
      // User hasn't been onboarded yet — treat as free
      return NextResponse.json({ clerkId: userId, name: "", plan: "free" });
    }

    return NextResponse.json({
      clerkId: user.clerkId,
      name: user.name,
      plan: user.plan,
    });
  } catch (e) {
    console.error("GET /api/users/me", e);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/users/me/route.ts
git commit -m "feat: add GET /api/users/me route"
```

---

## Task 5: POST + GET /api/reading-progress

**Files:**
- Create: `src/app/api/reading-progress/route.ts`

- [ ] **Step 1: Create the file**

```ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { ReadingProgressModel } from "@/modules/reading-progress/model";

const upsertSchema = z.object({
  bookId: z.string().min(1),
  currentPage: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { bookId, currentPage, totalPages } = parsed.data;

    await connectToDatabase();

    await ReadingProgressModel.findOneAndUpdate(
      { userId, bookId },
      { currentPage, totalPages, lastReadAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/reading-progress", e);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");
    if (!bookId) {
      return NextResponse.json({ error: "bookId required" }, { status: 400 });
    }

    await connectToDatabase();

    const progress = await ReadingProgressModel.findOne({ userId, bookId })
      .select("currentPage totalPages")
      .lean();

    return NextResponse.json(
      progress
        ? { currentPage: progress.currentPage, totalPages: progress.totalPages }
        : null
    );
  } catch (e) {
    console.error("GET /api/reading-progress", e);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reading-progress/route.ts
git commit -m "feat: add POST+GET /api/reading-progress route"
```

---

## Task 6: GET /api/reading-progress/recent

**Files:**
- Create: `src/app/api/reading-progress/recent/route.ts`

This route joins reading progress with book data so the home page can render Continue Reading cards without a second fetch.

- [ ] **Step 1: Create the file**

```ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { ReadingProgressModel } from "@/modules/reading-progress/model";
import { BookModel } from "@/modules/books/model";
import { generateGetPresignedUrl } from "@/lib/api/s3";

function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("amazonaws.com")) {
      return decodeURIComponent(parsed.pathname.slice(1));
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const recentProgress = await ReadingProgressModel.find({ userId })
      .sort({ lastReadAt: -1 })
      .limit(5)
      .lean();

    if (recentProgress.length === 0) {
      return NextResponse.json([]);
    }

    const bookIds = recentProgress.map((p) => p.bookId);
    const books = await BookModel.find({ _id: { $in: bookIds } })
      .select("_id title author coverUrl status")
      .lean();

    const bookMap = new Map(books.map((b) => [String(b._id), b]));

    const results = await Promise.all(
      recentProgress.map(async (p) => {
        const book = bookMap.get(p.bookId);
        if (!book) return null;

        let coverUrl = book.coverUrl ?? "";
        try {
          const key = extractS3Key(coverUrl);
          if (key) coverUrl = await generateGetPresignedUrl({ key });
        } catch {
          // keep original
        }

        return {
          bookId: p.bookId,
          currentPage: p.currentPage,
          totalPages: p.totalPages,
          lastReadAt: p.lastReadAt,
          book: {
            id: String(book._id),
            title: book.title,
            author: book.author,
            coverUrl,
            status: book.status,
          },
        };
      })
    );

    return NextResponse.json(results.filter(Boolean));
  } catch (e) {
    console.error("GET /api/reading-progress/recent", e);
    return NextResponse.json({ error: "Failed to fetch recent progress" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reading-progress/recent/route.ts
git commit -m "feat: add GET /api/reading-progress/recent route"
```

---

## Task 7: Onboarding Layout

**Files:**
- Create: `src/app/(onboarding)/layout.tsx`

- [ ] **Step 1: Create the file**

Full-screen, no AppShell, no navbar — just a centered canvas.

```tsx
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(onboarding)/layout.tsx
git commit -m "feat: add onboarding route group layout"
```

---

## Task 8: Onboarding Page

**Files:**
- Create: `src/app/(onboarding)/onboarding/page.tsx`

This is a client component. It reads Clerk user data, fires `POST /api/users/onboard` on mount, then immediately redirects. The entire visible window is ~300–500ms.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { BookOpen } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const called = useRef(false);

  useEffect(() => {
    if (!isLoaded || called.current) return;
    called.current = true;

    fetch("/api/users/onboard", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.alreadyExists) {
          router.replace("/onboarding-error");
        } else {
          router.replace("/");
        }
      })
      .catch(() => {
        // On error still send to home — don't block the user
        router.replace("/");
      });
  }, [isLoaded, router]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Logo */}
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <BookOpen className="size-7 text-primary" />
      </div>

      {/* Avatar + name */}
      {isLoaded && user && (
        <div className="flex flex-col items-center gap-3">
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.fullName ?? "Your avatar"}
              width={64}
              height={64}
              className="rounded-full ring-2 ring-primary/20"
              unoptimized
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
              {(user.firstName ?? "U")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-bold">
              Welcome, {user.firstName ?? "Reader"}!
            </p>
            <p className="text-sm text-muted-foreground">
              Setting up your library…
            </p>
          </div>
        </div>
      )}

      {/* Spinner */}
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(onboarding)/onboarding/page.tsx
git commit -m "feat: add onboarding splash page"
```

---

## Task 9: Onboarding Error Page

**Files:**
- Create: `src/app/(onboarding)/onboarding-error/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OnboardingErrorPage() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card px-8 py-10 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Lock className="size-5 text-muted-foreground" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-lg font-bold">Already onboarded</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your account is already set up. You don&apos;t need to visit this page again.
        </p>
      </div>

      <Button asChild className="gap-2 rounded-full">
        <Link href="/">
          Go to Home
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(onboarding)/onboarding-error/page.tsx
git commit -m "feat: add onboarding-error page"
```

---

## Task 10: Clerk Middleware

**Files:**
- Create: `src/middleware.ts`

Protect `/upload` and `/books/new` behind Clerk auth. The `/onboarding` route requires auth too (so unauthenticated users can't land on it). No DB check in middleware — the page handles that.

- [ ] **Step 1: Create the file**

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/upload(.*)",
  "/books/new(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Clerk middleware for protected routes"
```

---

## Task 11: Update SignUp afterSignUpUrl

**Files:**
- Modify: `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Modify the file**

Current content:
```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <SignUp />;
}
```

New content:
```tsx
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <SignUp afterSignUpUrl="/onboarding" />;
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Test manually**
  - Sign up with a new account
  - Confirm you land on `/onboarding`, see the splash, then get redirected to `/`

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
git commit -m "feat: redirect to /onboarding after sign-up"
```

---

## Task 12: GuestLimitModal

**Files:**
- Create: `src/components/gates/GuestLimitModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Link from "next/link";
import { BookOpen, ArrowRight, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuestLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestLimitModal({ open, onOpenChange }: GuestLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="size-6 text-primary" />
        </div>

        <DialogHeader className="items-center">
          <DialogTitle>You&apos;ve read 2 books as a guest</DialogTitle>
          <DialogDescription className="text-center">
            Sign up free to unlock 5 books, AI chat, and reading progress across devices.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2.5">
          <Button asChild className="w-full gap-2 rounded-full">
            <Link href="/sign-up">
              <UserPlus className="size-4" />
              Sign Up Free
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link href="/sign-in">
              Already have an account? Log In
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/gates/GuestLimitModal.tsx
git commit -m "feat: add GuestLimitModal component"
```

---

## Task 13: UpgradeModal

**Files:**
- Create: `src/components/gates/UpgradeModal.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Link from "next/link";
import { Zap, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Zap className="size-6 text-primary" />
        </div>

        <DialogHeader className="items-center">
          <DialogTitle>You&apos;ve reached your 5-book limit</DialogTitle>
          <DialogDescription className="text-center">
            Upgrade to Pro for unlimited books, unlimited AI chat, and priority processing.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2.5">
          <Button asChild className="w-full gap-2 rounded-full shadow-md shadow-primary/20">
            <Link href="/pricing">
              <Zap className="size-4" />
              Upgrade to Pro
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/components/gates/UpgradeModal.tsx
git commit -m "feat: add UpgradeModal component"
```

---

## Task 14: Book Access Gate in BookDetailContent

**Files:**
- Modify: `src/app/(public)/book/[id]/book-detail-content.tsx`

The gate runs when the user clicks "Preview & Chat". It checks:
1. Is the user a guest? → check localStorage `bookify_guest_books`
2. Is the user on free plan? → check ReadingProgress count via `GET /api/users/me` + `GET /api/reading-progress/count`

Rather than a separate `/count` endpoint, we'll check count from the recent endpoint's length (≤5 max query) or add a simple check. Actually, the cleanest approach: add a `?count=1` param to the existing `GET /api/reading-progress` route so we avoid a new file.

- [ ] **Step 1: Modify `src/app/api/reading-progress/route.ts` to support count query**

Add this block at the top of the `GET` handler, right after the `userId` check and before the `bookId` check:

```ts
// Count mode — returns how many distinct books this user has progress for
const countMode = searchParams.get("count") === "1";
if (countMode) {
  await connectToDatabase();
  const count = await ReadingProgressModel.countDocuments({ userId });
  return NextResponse.json({ count });
}
```

The full updated GET handler becomes:

```ts
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Count mode — returns how many distinct books this user has progress for
    const countMode = searchParams.get("count") === "1";
    if (countMode) {
      await connectToDatabase();
      const count = await ReadingProgressModel.countDocuments({ userId });
      return NextResponse.json({ count });
    }

    const bookId = searchParams.get("bookId");
    if (!bookId) {
      return NextResponse.json({ error: "bookId required" }, { status: 400 });
    }

    await connectToDatabase();

    const progress = await ReadingProgressModel.findOne({ userId, bookId })
      .select("currentPage totalPages")
      .lean();

    return NextResponse.json(
      progress
        ? { currentPage: progress.currentPage, totalPages: progress.totalPages }
        : null
    );
  } catch (e) {
    console.error("GET /api/reading-progress", e);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Modify `src/app/(public)/book/[id]/book-detail-content.tsx`**

Replace the full file content with:

```tsx
"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

import { BookViewer } from "./_components/book-viewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Book } from "@/types/book";
import { GuestLimitModal } from "@/components/gates/GuestLimitModal";
import { UpgradeModal } from "@/components/gates/UpgradeModal";

const GUEST_BOOKS_KEY = "bookify_guest_books";
const GUEST_LIMIT = 2;
const FREE_LIMIT = 5;

interface BookDetailContentProps {
  params: Promise<{ id: string }>;
}

function BookDetailSkeleton() {
  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <div className="flex gap-4 sm:gap-6">
        <Skeleton className="aspect-[3/4] w-24 shrink-0 rounded-lg sm:w-40" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4 sm:h-8" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 hidden h-10 w-36 sm:block" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-10 w-full sm:hidden" />
    </div>
  );
}

export function BookDetailContent({ params }: BookDetailContentProps) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/books/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load book");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) setBook(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load book");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBookUpdate = useCallback((updated: Book) => {
    setBook(updated);
  }, []);

  /**
   * Called when user clicks "Preview & Chat".
   * Returns true if access is allowed, false if a gate modal was shown.
   */
  const checkAccess = useCallback(async (): Promise<boolean> => {
    // Guest path
    if (!isSignedIn) {
      const raw = localStorage.getItem(GUEST_BOOKS_KEY);
      const guestBooks: string[] = raw ? JSON.parse(raw) : [];
      if (guestBooks.includes(id)) return true; // resuming
      if (guestBooks.length >= GUEST_LIMIT) {
        setShowGuestModal(true);
        return false;
      }
      localStorage.setItem(
        GUEST_BOOKS_KEY,
        JSON.stringify([...guestBooks, id])
      );
      return true;
    }

    // Authenticated path — check plan
    try {
      const [meRes, progressRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch(`/api/reading-progress?bookId=${id}`),
      ]);
      const me = await meRes.json();
      const existingProgress = await progressRes.json();

      if (me.plan === "pro") return true;

      // Free plan: allowed if book already has progress OR total count < 5
      if (existingProgress !== null) return true;

      const countRes = await fetch("/api/reading-progress?count=1");
      const { count } = await countRes.json();
      if (count < FREE_LIMIT) return true;

      setShowUpgradeModal(true);
      return false;
    } catch {
      // On error, allow access — don't block the reader
      return true;
    }
  }, [id, isSignedIn]);

  if (loading) return <BookDetailSkeleton />;
  if (notFound || !book) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground">Book not found.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <BookViewer book={book} onBookUpdate={handleBookUpdate} onCheckAccess={checkAccess} />
      <GuestLimitModal open={showGuestModal} onOpenChange={setShowGuestModal} />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
}
```

- [ ] **Step 3: Update `BookViewer` to accept and call `onCheckAccess`**

In `src/app/(public)/book/[id]/_components/book-viewer.tsx`, modify the `BookViewerProps` interface and the "Preview & Chat" buttons:

Find the interface:
```ts
interface BookViewerProps {
  book: Book;
  onBookUpdate?: (book: Book) => void;
}
```

Replace with:
```ts
interface BookViewerProps {
  book: Book;
  onBookUpdate?: (book: Book) => void;
  onCheckAccess?: () => Promise<boolean>;
}
```

Update the function signature:
```ts
export function BookViewer({
  book: initialBook,
  onBookUpdate,
  onCheckAccess,
}: BookViewerProps) {
```

Add a handler for the preview button click. Find the two "Preview & Chat" `Button` elements (desktop + mobile) and replace both `<Button className="gap-2" asChild>` blocks with a client-side handler:

For the **desktop** "Preview & Chat" button (inside `isReady && (...)`), replace:
```tsx
{isReady && (
  <Button className="gap-2" asChild>
    <Link href={`/preview/${book.id}`}>
      <Eye className="size-4" />
      Preview & Chat
    </Link>
  </Button>
)}
```
With:
```tsx
{isReady && (
  <Button
    className="gap-2"
    onClick={async () => {
      const allowed = onCheckAccess ? await onCheckAccess() : true;
      if (allowed) window.location.href = `/preview/${book.id}`;
    }}
  >
    <Eye className="size-4" />
    Preview & Chat
  </Button>
)}
```

For the **mobile** "Preview & Chat" button, replace:
```tsx
{isReady && (
  <Button className="w-full gap-2" asChild>
    <Link href={`/preview/${book.id}`}>
      <Eye className="size-4" />
      Preview & Chat
    </Link>
  </Button>
)}
```
With:
```tsx
{isReady && (
  <Button
    className="w-full gap-2"
    onClick={async () => {
      const allowed = onCheckAccess ? await onCheckAccess() : true;
      if (allowed) window.location.href = `/preview/${book.id}`;
    }}
  >
    <Eye className="size-4" />
    Preview & Chat
  </Button>
)}
```

- [ ] **Step 4: Verify types**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/reading-progress/route.ts \
        src/app/(public)/book/[id]/book-detail-content.tsx \
        src/app/(public)/book/[id]/_components/book-viewer.tsx
git commit -m "feat: add book access gate for guest and free plan users"
```

---

## Task 15: Reading Progress Save & Resume in PreviewContent/PreviewShell

**Files:**
- Modify: `src/app/(preview)/preview/[id]/_components/preview-content.tsx`
- Modify: `src/app/(preview)/preview/[id]/_components/preview-shell.tsx`

**Step overview:** `PreviewContent` loads the saved page from the API and passes it as `initialPage` to `PreviewShell`. `PreviewShell` initialises `currentPage` from `initialPage` and saves progress via a debounced call on `onPageChange`. Guest progress is handled in `PreviewContent` via localStorage.

- [ ] **Step 1: Modify `src/app/(preview)/preview/[id]/_components/preview-content.tsx`**

Replace the full file content:

```tsx
"use client";

import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

import type { Book } from "@/types/book";
import { PreviewShell } from "./preview-shell";

const GUEST_PROGRESS_KEY = "bookify_guest_progress";

interface GuestProgress {
  [bookId: string]: { page: number; title: string; coverUrl: string };
}

interface PreviewContentProps {
  params: Promise<{ id: string }>;
}

export function PreviewContent({ params }: PreviewContentProps) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialPage, setInitialPage] = useState(1);

  // Load book data
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load book");
        return res.json();
      })
      .then((data: Book) => {
        if (!cancelled) setBook(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load book");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load saved reading progress
  useEffect(() => {
    if (isSignedIn === undefined) return; // Clerk not loaded yet

    if (isSignedIn) {
      fetch(`/api/reading-progress?bookId=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.currentPage === "number" && data.currentPage > 1) {
            setInitialPage(data.currentPage);
          }
        })
        .catch(() => {
          // Silently fail — start from page 1
        });
    } else {
      // Guest: read from localStorage
      try {
        const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
        const guestProgress: GuestProgress = raw ? JSON.parse(raw) : {};
        const saved = guestProgress[id];
        if (saved && saved.page > 1) {
          setInitialPage(saved.page);
        }
      } catch {
        // Silently fail
      }
    }
  }, [id, isSignedIn]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Book not found.</p>
      </div>
    );
  }

  return (
    <PreviewShell
      book={book}
      initialPage={initialPage}
      isSignedIn={isSignedIn ?? false}
    />
  );
}
```

- [ ] **Step 2: Modify `src/app/(preview)/preview/[id]/_components/preview-shell.tsx`**

Replace the full file content:

```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

const GUEST_PROGRESS_KEY = "bookify_guest_progress";
const SAVE_DEBOUNCE_MS = 2000;

interface PreviewShellProps {
  book: Book;
  initialPage?: number;
  isSignedIn?: boolean;
}

export function PreviewShell({
  book,
  initialPage = 1,
  isSignedIn = false,
}: PreviewShellProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [numPages, setNumPages] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initialPage if it arrives after first render (async progress load)
  useEffect(() => {
    if (initialPage > 1) {
      setCurrentPage(initialPage);
    }
  }, [initialPage]);

  const saveProgress = useCallback(
    (page: number, total: number | null) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (isSignedIn) {
          fetch("/api/reading-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookId: book.id,
              currentPage: page,
              totalPages: total ?? 0,
            }),
          }).catch(() => {
            // Silently fail — progress will save next time
          });
        } else {
          // Guest: save to localStorage
          try {
            const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
            const guestProgress = raw ? JSON.parse(raw) : {};
            guestProgress[book.id] = {
              page,
              title: book.title,
              coverUrl: book.coverUrl,
            };
            localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(guestProgress));
          } catch {
            // Silently fail
          }
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [book.id, book.title, book.coverUrl, isSignedIn]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      saveProgress(page, numPages);
    },
    [numPages, saveProgress]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

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
                  onPageChange={handlePageChange}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main layout */}
      <div className="grid flex-1 overflow-hidden md:grid-cols-2">
        {/* PDF panel */}
        <div className="overflow-hidden md:border-r">
          <PreviewPdfPanel
            bookId={book.id}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onNumPagesChange={setNumPages}
          />
        </div>

        {/* Side panel — desktop only */}
        <div className="hidden overflow-hidden md:block">
          <SidePanel
            book={book}
            currentPage={currentPage}
            numPages={numPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify types**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(preview)/preview/[id]/_components/preview-content.tsx \
        src/app/(preview)/preview/[id]/_components/preview-shell.tsx
git commit -m "feat: load and save reading progress in preview shell"
```

---

## Task 16: ContinueReadingSection

**Files:**
- Create: `src/app/(public)/_components/continue-reading-section.tsx`

This is a client component that fetches recent progress and renders a horizontal scroll row.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { BookMarked, ArrowRight, LogIn } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";

interface RecentProgressItem {
  bookId: string;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    status: string;
  };
}

const FALLBACK_COVER = "/file.svg";

export function ContinueReadingSection() {
  const { isSignedIn, isLoaded } = useAuth();
  const [items, setItems] = useState<RecentProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    fetch("/api/reading-progress/recent")
      .then((res) => res.json())
      .then((data: RecentProgressItem[]) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isSignedIn, isLoaded]);

  // Not loaded yet — render nothing to avoid layout shift
  if (!isLoaded || loading) return null;

  // Guest nudge
  if (!isSignedIn) {
    return (
      <section className="pb-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
          <BookMarked className="size-4 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-muted-foreground">
            Sign up to track your reading progress across devices.
          </p>
          <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full text-xs">
            <Link href="/sign-up">
              <LogIn className="size-3.5" />
              Sign Up
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  // Signed in but no progress yet
  if (items.length === 0) return null;

  return (
    <section className="pb-2">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
          <BookMarked className="size-3.5 text-primary" />
        </div>
        <h2 className="text-base font-bold tracking-tight">Continue Reading</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <ContinueReadingCard key={item.bookId} item={item} />
        ))}
      </div>
    </section>
  );
}

function ContinueReadingCard({ item }: { item: RecentProgressItem }) {
  const [coverSrc, setCoverSrc] = useState(item.book.coverUrl || FALLBACK_COVER);
  const progress =
    item.totalPages > 0
      ? Math.round((item.currentPage / item.totalPages) * 100)
      : 0;

  const timeAgo = formatDistanceToNow(new Date(item.lastReadAt), {
    addSuffix: true,
  });

  return (
    <Link
      href={`/preview/${item.book.id}`}
      className="group flex w-36 shrink-0 flex-col gap-2 rounded-xl border border-border/40 bg-card p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-44"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted/60">
        <Image
          src={coverSrc}
          alt={item.book.title}
          fill
          className="object-contain p-1"
          sizes="176px"
          onError={() => setCoverSrc(FALLBACK_COVER)}
        />
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <p className="line-clamp-1 text-xs font-semibold">{item.book.title}</p>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {item.book.author}
        </p>

        {/* Progress bar */}
        <div className="space-y-0.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {item.totalPages > 0
              ? `p. ${item.currentPage} of ${item.totalPages}`
              : `p. ${item.currentPage}`}
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
      </div>

      {/* Continue button */}
      <div className="mt-auto flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Continue
        <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/_components/continue-reading-section.tsx
git commit -m "feat: add ContinueReadingSection component"
```

---

## Task 17: Update HomePage

**Files:**
- Modify: `src/app/(public)/_components/home-page.tsx`

- [ ] **Step 1: Modify the file**

Replace the full file content:

```tsx
import { BookOpen } from "lucide-react";

import { HeroSection } from "./hero-section";
import { LibraryContent } from "./library-content";
import { ContinueReadingSection } from "./continue-reading-section";

export function HomePage() {
  return (
    <div className="space-y-6">
      <HeroSection />

      <ContinueReadingSection />

      <section className="pb-20">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
            <BookOpen className="size-3.5 text-primary" />
          </div>
          <h2 className="text-base font-bold tracking-tight">Recent Books</h2>
        </div>
        <LibraryContent limit={10} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

```bash
npm run type-check
```

- [ ] **Step 3: Full lint pass**

```bash
npm run lint
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/_components/home-page.tsx
git commit -m "feat: add ContinueReadingSection to home page"
```

---

## Final Verification

- [ ] Run `npm run type-check` — zero errors
- [ ] Run `npm run lint` — zero errors
- [ ] Sign up with a new account → lands on `/onboarding` → branded splash → redirects to `/`
- [ ] Revisit `/onboarding` when already onboarded → lands on `/onboarding-error`
- [ ] Open 2 books as guest → on 3rd, `GuestLimitModal` appears
- [ ] Open 5 books as free user → on 6th, `UpgradeModal` appears
- [ ] Read to page 10 on any book → navigate away → return to preview → PDF resumes at page 10
- [ ] Home page shows "Continue Reading" row with progress bars after reading at least one book
