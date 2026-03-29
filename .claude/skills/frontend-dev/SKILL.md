---
name: nextjs-frontend
description: >
  Common skill for building and maintaining production-grade Next.js 16 + React 19 frontend applications with
  App Router, tRPC 11, TanStack Query, shadcn/ui (60+ Radix components), Tailwind CSS 4 (OKLCH color space),
  Framer Motion, Clerk auth, Zod validation, and TypeScript strict mode. Use this skill whenever creating new
  pages, layouts, components, forms, API routes, or hooks in any Next.js project following this stack. Trigger
  on any mention of "Next.js page", "React component", "shadcn component", "tRPC route", "Tailwind styling",
  "App Router layout", "server component", "client component", "form with Zod", "Clerk auth page",
  "Framer Motion animation", "TanStack Query hook", "responsive layout", "dark mode", "OKLCH theme",
  or general frontend development tasks within this tech stack — even if the user doesn't name the stack
  explicitly. Also trigger when the user asks to scaffold a new feature, add a page, wire up an API call,
  build a dashboard, create a modal/dialog, or implement any UI pattern in a Next.js App Router project.
---

# Next.js Frontend Development Skill

## Overview

This skill defines conventions, patterns, and best practices for building production-grade Next.js 16 frontends with the following standardized stack. It is **project-agnostic** — use it across any frontend that follows this architecture.

---

## Tech Stack Reference

| Layer     | Technology                                      | Version          |
| --------- | ----------------------------------------------- | ---------------- |
| Framework | Next.js (App Router, RSC, Route Groups)         | 16.x             |
| React     | React + TypeScript (strict)                     | 19.x             |
| API       | tRPC + TanStack Query + Axios                   | 11.x / 5.x / 1.x |
| Auth      | Clerk (`@clerk/nextjs`)                         | 6.x              |
| UI        | shadcn/ui on Radix UI + Tailwind CSS 4          | latest           |
| Styling   | OKLCH colors, next-themes, tw-animate-css       | —                |
| Animation | Framer Motion                                   | 12.x             |
| Forms     | React Hook Form + Zod                           | 7.x / 4.x        |
| Icons     | Lucide React                                    | latest           |
| Charts    | Recharts                                        | 2.x              |
| Dates     | date-fns + react-day-picker                     | 4.x / 9.x        |
| Toast     | Sonner                                          | 2.x              |
| URL State | nuqs                                            | 2.x              |
| Fonts     | Plus Jakarta Sans (body), JetBrains Mono (code) | —                |

---

## Canonical Folder Structure

Every project MUST follow this layout. Adapt the route groups and module names to fit the domain, but preserve the organizational pattern.

```
project-root/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (fonts, theme, providers)
│   │   ├── globals.css               # Tailwind directives + CSS custom properties
│   │   ├── providers.tsx             # Client-side provider composition
│   │   ├── not-found.tsx             # Custom 404
│   │   │
│   │   ├── (auth)/                   # Route group — auth pages (Clerk catch-all)
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   │
│   │   ├── (protected)/              # Route group — requires auth
│   │   │   └── <feature>/
│   │   │       ├── page.tsx
│   │   │       └── _components/      # Page-scoped components (underscore = not a route)
│   │   │
│   │   ├── (public)/                 # Route group — no auth required
│   │   │   ├── page.tsx              # Landing / Home
│   │   │   ├── <feature>/page.tsx
│   │   │   └── <feature>/[id]/page.tsx
│   │   │
│   │   └── api/
│   │       └── trpc/[trpc]/route.ts  # tRPC HTTP handler
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (accordion → tooltip)
│   │   └── <SharedComponent>.tsx     # App-wide shared components
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── use-<name>.ts
│   │
│   ├── lib/                          # Pure utilities & API clients
│   │   ├── api/                      # REST/fetch wrappers per domain
│   │   │   ├── client.ts             # Axios/fetch instance with base URL + interceptors
│   │   │   └── <domain>.ts           # e.g. content.ts, health.ts, media.ts
│   │   ├── utils.ts                  # cn() helper + generic utilities
│   │   └── query-client.ts           # TanStack QueryClient factory
│   │
│   ├── modules/                      # Feature modules (domain-driven)
│   │   └── <module>/
│   │       ├── actions.ts            # Server actions
│   │       ├── schema.ts             # Zod schemas for this module
│   │       ├── types.ts              # TypeScript types/interfaces
│   │       └── server/
│   │           └── procedures.ts     # tRPC procedures for this module
│   │
│   ├── trpc/                         # tRPC infra
│   │   ├── client.tsx                # tRPC React client + provider
│   │   ├── context.ts                # Request context (auth, db, etc.)
│   │   ├── init.ts                   # tRPC instance + base procedures
│   │   ├── query-client.ts           # Shared query-client for tRPC
│   │   ├── server.tsx                # Server-side tRPC caller
│   │   └── routers/
│   │       └── _app.ts              # Root router (merges module routers)
│   │
│   └── types/                        # Shared/global TypeScript types
│       └── <domain>.ts
│
├── components.json                   # shadcn config (style, base color, CSS vars, icon lib)
├── next.config.ts                    # Image domains, redirects, env
├── tailwind.config.ts                # (if needed — Tailwind v4 prefers CSS config)
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

### Key Conventions

- **Route Groups** `(auth)`, `(protected)`, `(public)` — separate layout/proxy concerns without affecting URL paths.
- **`_components/`** inside page folders — co-located, page-scoped components. The underscore prefix tells Next.js to skip it as a route segment.
- **`modules/`** — domain-driven feature slices. Each module owns its schemas, types, actions, and tRPC procedures.
- **`lib/api/`** — REST/fetch wrappers for external backends. One file per domain.
- **`trpc/`** — infrastructure only. Business logic lives in `modules/<name>/server/procedures.ts`.

---

## Component Patterns

### Server Components (Default)

Every component is a Server Component unless it needs interactivity. No `"use client"` directive = server component.

```tsx
// src/app/(public)/page.tsx — Server Component (default)
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";

export default async function HomePage() {
  const data = await fetchContent(); // runs on server
  return (
    <main>
      <HeroBanner />
      <ContentRow items={data} />
    </main>
  );
}
```

### Client Components

Add `"use client"` only when you need: hooks, event handlers, browser APIs, or context providers.

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function InteractiveCard({ title }: { title: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div layout>
      <h3>{title}</h3>
      <Button onClick={() => setExpanded(!expanded)}>
        {expanded ? "Collapse" : "Expand"}
      </Button>
    </motion.div>
  );
}
```

### Composition Rule

Prefer **Server Component parents** wrapping **Client Component children**. Pass serializable props down. Never import a Server Component inside a Client Component.

---

## Styling System

### Tailwind CSS 4 + OKLCH

All colors use OKLCH color space via CSS custom properties. Define them in `globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --muted: oklch(0.97 0 0);
  --accent: oklch(0.97 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.65rem;
  --font-sans: "Plus Jakarta Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... dark variants */
}
```

### `cn()` Utility

Always use `cn()` for conditional class merging:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usage:

```tsx
<div
  className={cn(
    "rounded-lg border p-4",
    isActive && "border-primary bg-primary/10",
    className,
  )}
/>
```

### Styling Rules

1. **Never use inline `style` props** unless absolutely necessary (dynamic computed values only).
2. **Use Tailwind utilities first**, CSS custom properties second, raw CSS last.
3. **Dark mode** — use `next-themes` + the `dark:` variant. Never hardcode colors.
4. **Responsive** — mobile-first: `base → sm → md → lg → xl → 2xl`.
5. **Animations** — prefer Framer Motion for orchestrated sequences; Tailwind's `animate-*` / `tw-animate-css` for simple transitions.

---

## Forms Pattern

All forms use React Hook Form + Zod:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof formSchema>;

export function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", email: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await submitToApi(values);
      toast.success("Saved!");
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Submit
        </Button>
      </form>
    </Form>
  );
}
```

---

## Data Fetching Patterns

### tRPC (Type-Safe, Internal)

Use for features that need end-to-end type safety (AI modules, content CRUD, etc.):

```tsx
"use client";

import { trpc } from "@/trpc/client";

export function ContentList() {
  const { data, isLoading } = trpc.content.list.useQuery();
  if (isLoading) return <Skeleton />;
  return data?.map((item) => <ContentCard key={item.id} {...item} />);
}
```

### REST via lib/api (External Backends)

Use for calls to external services (Java/Go/Python backends, third-party APIs):

```ts
// src/lib/api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
});

// src/lib/api/content.ts
import { apiClient } from "./client";
import type { Content } from "@/types/content";

export async function getContent(id: string): Promise<Content> {
  const { data } = await apiClient.get<Content>(`/api/content/${id}`);
  return data;
}
```

### Custom Hooks

Wrap data-fetching logic in hooks for reuse and encapsulation:

```ts
// src/hooks/use-backend-health.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { checkHealth } from "@/lib/api/health";

export function useBackendHealth() {
  return useQuery({
    queryKey: ["backend-health"],
    queryFn: checkHealth,
    refetchInterval: 30_000,
    retry: 3,
  });
}
```

---

## tRPC Setup

### Init (`src/trpc/init.ts`)

```ts
import { initTRPC, TRPCError } from "@trpc/server";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
```

### Root Router (`src/trpc/routers/_app.ts`)

```ts
import { router } from "../init";
import { contentRouter } from "@/modules/content/server/procedures";
import { aiRouter } from "@/modules/ai/server/procedures";

export const appRouter = router({
  content: contentRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
```

### Module Procedure (`src/modules/content/server/procedures.ts`)

```ts
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/trpc/init";
import { contentSchema } from "../schema";

export const contentRouter = router({
  list: publicProcedure.query(async () => {
    // fetch from backend
  }),
  create: protectedProcedure
    .input(contentSchema)
    .mutation(async ({ input, ctx }) => {
      // create content
    }),
});
```

---

## Animation Patterns (Framer Motion)

### Page Transitions

```tsx
"use client";

import { motion } from "framer-motion";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### Staggered Lists

```tsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((i) => (
    <motion.li key={i.id} variants={item}>
      {i.name}
    </motion.li>
  ))}
</motion.ul>;
```

---

## Auth (Clerk)

### Middleware (`proxy.ts`)

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher(["/(protected)(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
```

### Auth Pages

Clerk catch-all pages go in `(auth)/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

---

## Adding a New Feature (Checklist)

When adding a new feature (e.g. "comments"), follow this sequence:

1. **Types** — `src/modules/comments/types.ts` — define interfaces
2. **Schema** — `src/modules/comments/schema.ts` — Zod validation schemas
3. **Procedures** — `src/modules/comments/server/procedures.ts` — tRPC router
4. **Register** — add to `src/trpc/routers/_app.ts`
5. **Page** — `src/app/(protected)/comments/page.tsx` or `(public)/...`
6. **Components** — page-scoped in `_components/`, shared in `src/components/`
7. **Hooks** — `src/hooks/use-comments.ts` if reusable logic is needed
8. **REST** (if external) — `src/lib/api/comments.ts`

---

## Environment Variables Convention

```env
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Backend
NEXT_PUBLIC_API_URL=             # Client-side (browser) backend URL
API_URL=                          # Server-side backend URL

# App
NEXT_PUBLIC_APP_URL=

# AI (if applicable)
OPENAI_API_KEY=
```

- `NEXT_PUBLIC_*` — exposed to the browser. Use for URLs the client calls directly.
- Without prefix — server-only. Use for secrets and server-to-server URLs.

---

## Performance Checklist

- Use `next/image` for all images (with configured `remotePatterns` in `next.config.ts`)
- Prefer Server Components — they ship zero JS to the client
- Lazy-load heavy client components with `next/dynamic`
- Use TanStack Query's `staleTime` and `gcTime` to avoid redundant fetches
- Code-split per route group — route groups naturally create separate bundles
- Keep `"use client"` boundary as low in the tree as possible

---

## Common shadcn/ui Component Usage

The `components.json` config uses: **new-york** style, **neutral** base color, **OKLCH** CSS variables, and **lucide** icons.

When adding new shadcn components:

```bash
npx shadcn@latest add <component-name>
```

Commonly used components and when to reach for them:

- **Dialog / Sheet** — modals and slide-overs
- **Form + Input + Select + Textarea** — all form fields
- **Card** — content containers
- **Table** — data display
- **Tabs** — section switching
- **Skeleton** — loading states
- **Alert / AlertDialog** — messages and confirmations
- **DropdownMenu / ContextMenu** — action menus
- **Tooltip** — hover hints
- **Sonner (toast)** — success/error notifications

---

## Scripts

```bash
npm run dev          # Start dev server (default port 3001)
npm run build        # Production build
npm run lint         # ESLint check
npm run start        # Start production server
```
