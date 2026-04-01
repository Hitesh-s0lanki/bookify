# About Page & Footer — Builder Profile Redesign

**Date:** 2026-04-01
**Status:** Approved

---

## Goal

Replace the existing about page with a builder-focused page that weaves in what Bookify does alongside who built it. Also add the GitHub project link to the footer.

---

## About Page — New Structure

### Header
- Title: "About Bookify" (existing gradient style preserved)
- Subtitle: "An AI-powered reading platform — upload any PDF, chat with it, listen to it, and get deep insights. Built by one developer who loves books and shipping things."

### Built By (new primary section)
A styled card containing:
- Avatar: styled initials "HS" with amber gradient background (no photo dependency)
- Name: Hitesh Solanki
- Title: Software Engineer · Mumbai, India
- Bio: "I believe in building meaningful products through clarity, ownership, and strong execution. I love breaking down complex challenges, designing simple solutions, and using technology as a multiplier for business growth."
- Social links row:
  - GitHub: https://github.com/hitesh-s0lanki
  - LinkedIn: https://www.linkedin.com/in/hitesh-s0lanki
  - Portfolio: https://hitesh-solanki.vercel.app

### Tech Stack
Compact tag grid of technologies used specifically in Bookify:
Next.js, TypeScript, React, Tailwind CSS, MongoDB, PostgreSQL, LangChain, Google Gemini, AWS S3, Clerk, Vapi AI, Inngest

### What It Does (features — kept, moved below builder)
The existing 4 feature cards (Smart Reading, Chat with Books, Voice Conversations, AI Insights) under a "What it does" heading.

---

## Footer Change

Add a GitHub icon + "GitHub" link to the nav links row pointing to:
`https://github.com/Hitesh-s0lanki/bookify`

Uses `Github` icon from `lucide-react`, same styling as existing nav links.

---

## Files to Change

1. `src/app/(public)/about/page.tsx` — full rewrite
2. `src/components/layout/footer.tsx` — add GitHub link to nav

---

## Out of Scope

- No new components/files needed
- No routing changes
- No photo/image assets required
