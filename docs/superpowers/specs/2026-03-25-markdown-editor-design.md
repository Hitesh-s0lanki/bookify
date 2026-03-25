# Markdown Editor Component — Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

Add a `MarkdownEditor` component — a fixed-height, scrollable text area with toggling between a raw markdown input ("Code") and a rendered preview ("Preview"). Used wherever description fields appear in the app.

---

## Component

**File:** `src/app/(protected)/upload/_components/markdown-editor.tsx`

### Props

```ts
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: string; // Tailwind class, default "h-48"
}
```

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
- The outer wrapper has a fixed height (default `h-48`) and `overflow-hidden`; both panels fill it and scroll independently.
- Tabs are in `text-xs`, positioned absolutely (or flexed) to the **top-right** of the component header.
- Uses the existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `src/components/ui/tabs.tsx`.

---

## Dependencies

| Package | Purpose | Action |
|---|---|---|
| `react-markdown` | Safe markdown → React rendering | Install (`npm i react-markdown`) |
| `@tailwindcss/typography` | `prose` classes for preview styling | Install (`npm i -D @tailwindcss/typography`) |

`@tailwindcss/typography` must be added to `tailwind.config` (or CSS `@plugin` if using Tailwind v4 CSS-first config).

---

## Integration Points

1. **`metadata-form.tsx`** — Replace the plain text display of `metadata.description` in the extracted metadata card with a read-only `MarkdownEditor` (disabled, preview-only mode, or just the preview tab shown). Alternatively, add as an editable field below the extracted card so users can tweak the description before uploading.

   > Decision: Show the extracted description as editable markdown in the form so users can adjust it before submitting. The component's `onChange` updates `metadata.description`.

2. **`edit-metadata-dialog.tsx`** — Replace the `<Textarea>` for the description field with `<MarkdownEditor>`.

---

## Styling

- Component border: `border border-input rounded-md`
- Header bar: `flex items-center justify-between px-3 py-1.5 border-b border-input bg-muted/30`
- Tabs in header use existing `Tabs` primitives with `variant="line"` or custom tight styling at `text-xs`
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
