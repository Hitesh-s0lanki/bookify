# Markdown Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `MarkdownEditor` component with Code/Preview tabs and integrate it into the upload metadata form and the edit metadata dialog.

**Architecture:** A single self-contained React client component (`src/components/markdown-editor.tsx`) wraps the existing `Tabs` primitive with a native `<textarea>` for raw markdown input and a `react-markdown` rendered preview. Height is fixed via inline style; both panels scroll independently within the wrapper.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4 (CSS-first), `react-markdown`, `@tailwindcss/typography`, shadcn/ui `Tabs` primitive.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/markdown-editor.tsx` | The MarkdownEditor component |
| Modify | `src/app/globals.css` | Add `@plugin "@tailwindcss/typography";` |
| Modify | `src/app/(protected)/upload/_components/metadata-form.tsx` | Replace static description block with `<MarkdownEditor>` |
| Modify | `src/app/(public)/book/[id]/_components/edit-metadata-dialog.tsx` | Replace `<Textarea>` for description with `<MarkdownEditor>` |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
cd /Users/Hemant/Desktop/projects/bookify
npm install react-markdown
npm install -D @tailwindcss/typography
```

Expected: both packages appear in `package.json` and `package-lock.json`. No errors.

- [ ] **Step 2: Verify installs**

`react-markdown` v9 is ESM-only — `require()` will not work. Use dynamic import:

```bash
node --input-type=module -e "import('react-markdown').then(() => console.log('ok'))"
```

Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-markdown and @tailwindcss/typography"
```

---

## Task 2: Enable typography plugin in Tailwind CSS

**Files:**
- Modify: `src/app/globals.css:1-4`

The project uses Tailwind v4 CSS-first. The typography plugin must be registered with `@plugin`, not via a `tailwind.config.js` file.

- [ ] **Step 1: Add the plugin directive**

Open `src/app/globals.css`. The first four lines currently look like:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

Add `@plugin "@tailwindcss/typography";` on a new line immediately after the three `@import` lines:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));
```

- [ ] **Step 2: Verify the dev server compiles without error**

```bash
npm run dev
```

Expected: server starts on port 3001, no CSS compilation errors in terminal. You can stop it again (`Ctrl+C`) — just confirming it compiles.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "chore: enable @tailwindcss/typography plugin"
```

---

## Task 3: Build the MarkdownEditor component

**Files:**
- Create: `src/components/markdown-editor.tsx`

This is the only new source file. It is a `"use client"` component. It must not import from any route-specific folder.

- [ ] **Step 1: Create the file**

Create `src/components/markdown-editor.tsx` with the following content:

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** CSS length value, e.g. "12rem" or "200px". Default: "12rem" */
  height?: string;
  /** Forwarded to the internal <textarea> */
  maxLength?: number;
  /** Forwarded to the internal <textarea> for <Label htmlFor> association */
  id?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write a description…",
  disabled = false,
  height = "12rem",
  maxLength,
  id,
}: MarkdownEditorProps) {
  return (
    <div
      className="overflow-hidden rounded-md border border-input"
      style={{ height }}
    >
      <Tabs defaultValue="code" className="gap-0 h-full">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-input bg-muted/30 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Description</span>
          <TabsList variant="line" className="h-auto gap-0 bg-transparent p-0">
            <TabsTrigger value="code" className="text-xs px-2 py-0.5">
              Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-2 py-0.5">
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Code tab */}
        <TabsContent value="code" className="h-full mt-0">
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              "h-full w-full resize-none bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground outline-none",
              "overflow-y-auto",
              disabled && "cursor-not-allowed opacity-50"
            )}
          />
        </TabsContent>

        {/* Preview tab */}
        <TabsContent value="preview" className="h-full mt-0 overflow-y-auto">
          {value.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 text-sm">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {placeholder}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/Hemant/Desktop/projects/bookify
npx tsc --noEmit
```

Expected: no errors for `src/components/markdown-editor.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/markdown-editor.tsx
git commit -m "feat: add MarkdownEditor component with Code/Preview tabs"
```

---

## Task 4: Integrate into metadata-form.tsx (upload flow)

**Files:**
- Modify: `src/app/(protected)/upload/_components/metadata-form.tsx:269-324`

The `hasMetadata` card currently displays the description as a static `<p>` inside a conditional block (lines 280-289). Replace that block with `<MarkdownEditor>`.

- [ ] **Step 1: Add the import**

At the top of `metadata-form.tsx`, after the existing local imports, add:

```tsx
import { MarkdownEditor } from "@/components/markdown-editor";
```

- [ ] **Step 2: Replace the static description block**

Find and remove this block (lines 280-289):

```tsx
{metadata.description && (
  <div className="rounded-lg bg-muted/50">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      Description
    </p>
    <p className="mt-1 text-sm leading-relaxed">
      {metadata.description}
    </p>
  </div>
)}
```

Replace it with:

```tsx
<MarkdownEditor
  value={metadata.description}
  onChange={(val) =>
    setMetadata((m) => ({ ...m, description: val }))
  }
  placeholder="No description extracted — write one here…"
  disabled={isBusy}
/>
```

> **Note:** This is an intentional behavior change. The original block was conditionally rendered (`{metadata.description && ...}`), so it was hidden when the AI returned no description. The `MarkdownEditor` is unconditional — it is always visible once the metadata card appears, giving users the ability to write a description even when extraction returned an empty string. Do **not** reintroduce a conditional wrapper.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Smoke test in the browser**

Start the dev server (`npm run dev`), navigate to `/upload` (sign in if required), upload a PDF + cover. Once extraction completes, verify:
- The description area appears inside the metadata card.
- Typing in Code tab updates content.
- Switching to Preview tab renders markdown.
- The "Upload book" button still works end-to-end.

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/upload/_components/metadata-form.tsx
git commit -m "feat: replace static description with MarkdownEditor in upload form"
```

---

## Task 5: Integrate into edit-metadata-dialog.tsx

**Files:**
- Modify: `src/app/(public)/book/[id]/_components/edit-metadata-dialog.tsx:129-139`

The existing dialog has a `<Textarea id="edit-description" ... maxLength={3000}>` (lines 131-138). Replace it with `<MarkdownEditor>` while preserving the `id` (for the adjacent `<Label htmlFor="edit-description">`) and the `maxLength={3000}` cap.

- [ ] **Step 1: Add the import**

At the top of `edit-metadata-dialog.tsx`, after the existing imports, add:

```tsx
import { MarkdownEditor } from "@/components/markdown-editor";
```

- [ ] **Step 2: Remove the Textarea import if no longer used**

Check whether `Textarea` is used anywhere else in `edit-metadata-dialog.tsx`. If the description field is its only usage, remove:

```tsx
import { Textarea } from "@/components/ui/textarea";
```

- [ ] **Step 3: Replace the Textarea**

Find and remove this block (lines 129-139):

```tsx
<div className="space-y-2 sm:col-span-2">
  <Label htmlFor="edit-description">Description</Label>
  <Textarea
    id="edit-description"
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Brief description of the book"
    rows={4}
    maxLength={3000}
  />
</div>
```

Replace it with:

```tsx
<div className="space-y-2 sm:col-span-2">
  <Label htmlFor="edit-description">Description</Label>
  <MarkdownEditor
    id="edit-description"
    value={description}
    onChange={setDescription}
    placeholder="Brief description of the book"
    disabled={saving}
    maxLength={3000}
  />
</div>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Smoke test in the browser**

Navigate to any book detail page, open the "Edit" dialog. Verify:
- The description field renders as the `MarkdownEditor`.
- Code tab shows the existing description text; it is editable.
- Preview tab renders it as markdown.
- Saving the form still works correctly (description value is passed to the PATCH API).
- The `<Label>` click focuses the textarea (confirming `id` forwarding works).

- [ ] **Step 6: Commit**

```bash
git add src/app/(public)/book/[id]/_components/edit-metadata-dialog.tsx
git commit -m "feat: replace Textarea with MarkdownEditor in edit metadata dialog"
```

---

## Task 6: Final build verification

- [ ] **Step 1: Run type check across the whole project**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Run linter**

```bash
npm run lint
```

Expected: zero errors (warnings are acceptable).

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: build completes successfully, no errors.

- [ ] **Step 4: Commit if any lint auto-fixes were applied**

Only needed if `lint:fix` changed files:

```bash
git add -A
git commit -m "chore: lint fixes after markdown editor integration"
```
