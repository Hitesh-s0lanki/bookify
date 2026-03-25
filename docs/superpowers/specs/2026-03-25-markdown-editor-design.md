# Markdown Editor Component — Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

Add a `MarkdownEditor` component — a fixed-height, scrollable text area with toggling between a raw markdown input ("Code") and a rendered preview ("Preview"). Used wherever description fields appear in the app.

---

## Component

**File:** `src/components/markdown-editor.tsx`

### Props

```ts
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: string;    // CSS value applied via style={{ height }}, default "12rem" (≈ h-48)
  maxLength?: number; // forwarded to the internal <textarea> in Code tab
  id?: string;        // forwarded to the internal <textarea> for label association
}
```

The `height` prop is a CSS value string (e.g. `"12rem"`, `"200px"`) applied as `style={{ height }}` on the outer wrapper — not a Tailwind class — to avoid Tailwind v4 content-scanning issues with runtime class names. Both the `<textarea>` and preview panel fill this wrapper via `h-full`.

### Structure

```
┌──────────────────────────────────────────┐
│ (optional label area)   [Code][Preview]  │  ← tabs, text-xs, top-right
├──────────────────────────────────────────┤
│                                          │
│   <textarea> (Code tab)                  │  ← fixed height, overflow-y-auto
│     OR                                   │
│   <prose markdown> (Preview tab)         │
│                                          │
└──────────────────────────────────────────┘
```

### Behaviour

- Default active tab: `code`
- **Code tab:** A native `<textarea>` with `resize-none`, `overflow-y-auto`, full width/height inside the panel. Styled consistent with `src/components/ui/textarea.tsx`.
- **Preview tab:** Renders the markdown via `react-markdown`. If value is empty, shows a muted placeholder. Scrollable (`overflow-y-auto`). Styled with `@tailwindcss/typography` prose classes (`prose prose-sm dark:prose-invert`).
- The outer wrapper has a fixed height applied via `style={{ height: height ?? "12rem" }}` and `overflow-hidden`; both panels fill it via `h-full` and scroll independently.
- Tabs are in `text-xs`, positioned absolutely (or flexed) to the **top-right** of the component header.
- Uses the existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `src/components/ui/tabs.tsx`.

---

## Dependencies

| Package | Purpose | Action |
|---|---|---|
| `react-markdown` | Safe markdown → React rendering | Install (`npm i react-markdown`) |
| `@tailwindcss/typography` | `prose` classes for preview styling | Install (`npm i -D @tailwindcss/typography`) |

Since this project uses Tailwind v4 CSS-first (no `tailwind.config.js`), add `@plugin "@tailwindcss/typography";` to `src/app/globals.css` immediately after the existing `@import` block. Do **not** use a `plugins` array in a config file.

---

## Integration Points

1. **`metadata-form.tsx`** — Remove the static `{metadata.description && ...}` block (lines 280-289) inside the `hasMetadata` card and replace it with a `<MarkdownEditor>` bound to `metadata.description`. The `onChange` handler updates state via `setMetadata(m => ({ ...m, description: value }))`. This gives users the ability to edit the AI-extracted description before submitting. The rest of the extracted-metadata card (title, author, genre, tags) is unchanged.

2. **`edit-metadata-dialog.tsx`** — Replace the `<Textarea id="edit-description">` (lines 131-138) with `<MarkdownEditor id="edit-description" maxLength={3000} ...>`. The existing `<Label htmlFor="edit-description">` continues to work because `id` is forwarded to the internal `<textarea>`. Preserve the `maxLength={3000}` cap that the original textarea had.

---

## Styling

- `<Tabs>` root: pass `className="gap-0 h-full"` to suppress the default `gap-2` the primitive applies unconditionally — without this the `h-full` content panel overflows the fixed-height outer wrapper by 8px.
- Component border: `border border-input rounded-md`
- Header bar: `flex items-center justify-between px-3 py-1.5 border-b border-input bg-muted/30`
- Tabs in header use existing `Tabs` primitives with `variant="line"` on `TabsList`. Apply `className="text-xs"` explicitly to each `TabsTrigger` — the `variant="line"` prop controls visual style only (underline indicator), not font size.
- Both panels: `h-full overflow-y-auto p-3`
- Preview prose: `prose prose-sm dark:prose-invert max-w-none text-sm`

---

## What Is Not In Scope

- Toolbar buttons (bold, italic, etc.)
- Drag-to-resize
- Line numbers
- Syntax highlighting in the Code tab
- Full-screen mode

---

## Success Criteria

- Toggling Code ↔ Preview is instant (no fetch, no re-parse delay for typical description lengths)
- Fixed height respected; both tabs scroll independently
- Tabs are visually `text-xs` and positioned top-right
- Works in both upload form and edit dialog
- No XSS risk (react-markdown does not use dangerouslySetInnerHTML by default)
