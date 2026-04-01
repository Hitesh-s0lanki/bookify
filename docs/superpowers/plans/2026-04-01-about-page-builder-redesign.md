# About Page & Footer — Builder Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the about page with a builder-focused layout (Hitesh Solanki) and add the GitHub project link to the footer.

**Architecture:** Two isolated file edits — a full rewrite of `about/page.tsx` with four sections (header, built-by card, tech stack, features), and a small addition to `footer.tsx` adding a GitHub nav link. No new files, no new components, no routing changes.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, lucide-react

---

## File Map

| Action | File |
|--------|------|
| Full rewrite | `src/app/(public)/about/page.tsx` |
| Modify | `src/components/layout/footer.tsx` |

---

### Task 1: Rewrite the About Page

**Files:**
- Modify: `src/app/(public)/about/page.tsx`

- [ ] **Step 1: Replace the full file content**

Replace the entire contents of `src/app/(public)/about/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Headphones, MessageCircle, Sparkles, Github, Linkedin, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Bookify",
};

const features = [
  {
    icon: BookOpen,
    title: "Smart Reading",
    description: "Upload any PDF and read it with a clean, distraction-free interface.",
  },
  {
    icon: MessageCircle,
    title: "Chat with Books",
    description: "Ask questions about any book and get accurate, AI-powered answers instantly.",
  },
  {
    icon: Headphones,
    title: "Voice Conversations",
    description: "Listen to summaries and have spoken conversations with your books.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description: "Get key takeaways, chapter summaries, and deep analysis automatically.",
  },
];

const techStack = [
  "Next.js", "TypeScript", "React", "Tailwind CSS",
  "MongoDB", "PostgreSQL", "LangChain", "Google Gemini",
  "AWS S3", "Clerk", "Vapi AI", "Inngest",
];

const socials = [
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com/hitesh-s0lanki",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/hitesh-s0lanki",
  },
  {
    icon: Globe,
    label: "Portfolio",
    href: "https://hitesh-solanki.vercel.app",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      {/* Header */}
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          About{" "}
          <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            Bookify
          </span>
        </h1>
        <p className="mx-auto max-w-lg text-muted-foreground">
          An AI-powered reading platform — upload any PDF, chat with it, listen
          to it, and get deep insights. Built by one developer who loves books
          and shipping things.
        </p>
      </header>

      {/* Built By */}
      <section className="rounded-xl border bg-card p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-semibold">Built by</h2>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-500 text-xl font-bold text-white">
            HS
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold">Hitesh Solanki</p>
              <p className="text-sm text-muted-foreground">
                Software Engineer · Mumbai, India
              </p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              I believe in building meaningful products through clarity,
              ownership, and strong execution. I love breaking down complex
              challenges, designing simple solutions, and using technology as a
              multiplier for business growth.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tech stack</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">What it does</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd /Users/Hemant/Desktop/projects/bookify && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors output (or only pre-existing unrelated errors)

- [ ] **Step 3: Commit**

```bash
cd /Users/Hemant/Desktop/projects/bookify
git add src/app/(public)/about/page.tsx
git commit -m "feat: redesign about page with builder profile and tech stack"
```

---

### Task 2: Add GitHub Link to Footer

**Files:**
- Modify: `src/components/layout/footer.tsx`

- [ ] **Step 1: Replace the full file content**

Replace the entire contents of `src/components/layout/footer.tsx` with:

```tsx
import Link from "next/link";
import Image from "next/image";
import { Github } from "lucide-react";

const links = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Image src="/logo.png" alt="Bookify" width={32} height={32} />
          <span>
            &copy; {new Date().getFullYear()} Bookify. All rights reserved.
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="https://github.com/Hitesh-s0lanki/bookify"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </Link>
        </nav>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd /Users/Hemant/Desktop/projects/bookify && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors output (or only pre-existing unrelated errors)

- [ ] **Step 3: Verify visual result**

Run the dev server and open `http://localhost:3001/about` in the browser.

Expected:
- Header with gradient "Bookify" title
- "Built by" card with amber/rose "HS" avatar, Hitesh Solanki name, bio, and 3 social link buttons (GitHub, LinkedIn, Portfolio)
- "Tech stack" section with 12 pill tags
- "What it does" section with 4 feature cards
- Footer shows GitHub icon + "GitHub" link on the right nav

- [ ] **Step 4: Commit**

```bash
cd /Users/Hemant/Desktop/projects/bookify
git add src/components/layout/footer.tsx
git commit -m "feat: add GitHub project link to footer"
```
