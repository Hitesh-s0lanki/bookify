# Design: Comprehensive Summary Agent Prompts

**Date:** 2026-03-29
**Status:** Approved

---

## Problem

The current summary pipeline produces shallow, high-level summaries. For books with enumerable structures (e.g., *48 Laws of Power* has 48 laws, *7 Habits* has 7 habits), the output omits individual items entirely. A reader cannot understand the full book content from a single summary read.

---

## Goal

Every book summary should be comprehensive enough that a reader can understand the entire book in one read — including every named law, rule, habit, principle, or chapter the book treats individually.

---

## Approach: A + C

**A — Auto-detect and enumerate:** When a book contains N named/numbered items (laws, rules, habits, principles, chapters), detect them during coverage planning and render each individually in the final output with its own subsection.

**C — Depth-first expansion:** Force the topic expansion agent to produce richer material per topic — more key points, concrete examples, practical applications, and a "why it matters" explanation.

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/summary/default-request.ts` | Replace one-liner with comprehensive multi-line prompt |
| `src/prompts/agents/requirement-discovery.md` | Default length → `comprehensive`; add `detectEnumerables` field |
| `src/prompts/agents/supervisor.md` | Update default JSON shape to reflect `comprehensive` length |
| `src/prompts/agents/coverage-blueprint.md` | Detect enumerable structures; list each item as `priority: high` topic |
| `src/prompts/agents/topic-expansion.md` | Require `examples`, `practicalApplication`, `whyItMatters` fields; expand key points to 5–8 |
| `src/prompts/agents/topic-synthesis.md` | Preserve depth; only merge true duplicates (same law, same chapter) |
| `src/prompts/agents/gap-identifier.md` | Stricter: if book has N named items, all N must be present before `complete` |
| `src/prompts/agents/summary-packing.md` | Detect enumerable topics; render dedicated per-item section; richer output structure |
| `src/modules/summary/constant.ts` | Update `SUMMARY_PROMPT` with enumerable detection and richer output structure |

---

## Design Details

### 1. Default Upload Prompt (`default-request.ts`)

Replace the single-line placeholder with:

```
Generate a comprehensive, detailed summary of this book that covers everything a reader needs to understand the full content in a single read.

If the book contains numbered laws, rules, habits, principles, or chapters — cover every single one individually with its core idea, key insight, and practical application.

Include:
- A full overview of the book's purpose and argument
- Every major concept, law, rule, or named item with depth
- Cross-cutting themes and patterns
- Key takeaways and actionable strategies
- A final synthesis of the book's central message

Do not skip, abbreviate, or group items that the book treats individually. If the book has 48 laws, cover all 48.
```

### 2. Requirement Discovery (`requirement-discovery.md`)

- Default `length` changes from `medium` → `comprehensive`
- Add `detectEnumerables: true` as a default field — instructs downstream agents to explicitly look for and enumerate laws/rules/habits/chapters
- Add rule: if user request contains no explicit length preference, default to `comprehensive`

### 3. Supervisor (`supervisor.md`)

- Update the example JSON shape: `"length": "comprehensive"` instead of `"medium"`
- Add `"detectEnumerables": true` to the expected shape
- Add rule: preserve `detectEnumerables` flag from requirement discovery

### 4. Coverage Blueprint (`coverage-blueprint.md`)

Key additions:
- **Enumerable detection rule:** Before building the topic list, check if the book's content reveals a set of numbered/named items (laws, rules, habits, steps, principles, commandments, etc.). If detected, add EACH item as its own topic with `priority: high`.
- **Completeness mandate:** If the book has N named items, the topic list must contain all N. Do not group them.
- **Chapter coverage:** Every chapter should map to at least one topic.
- Remove the 100-topic cap for books with enumerable structures (a 48-law book legitimately needs 48+ topics).

New `enumerables` field in output:
```json
{
  "enumerables": {
    "detected": true,
    "type": "laws",
    "count": 48,
    "label": "Law"
  },
  "requiredChapters": [1, 2, 3],
  "topics": [...]
}
```

### 5. Topic Expansion (`topic-expansion.md`)

Expand the output schema per topic to require:
- `detailedSummary` — 3–5 sentences (up from 1)
- `keyPoints` — 5–8 points (up from 2–3)
- `examples` — 1–2 concrete examples from the book
- `practicalApplication` — how to apply this in real life
- `whyItMatters` — why this topic is significant in the context of the book

All fields are required. If a topic lacks examples in the source material, `examples` can be `[]` but must be present.

### 6. Topic Synthesis (`topic-synthesis.md`)

Change compression rules:
- **Never merge** two topics that are distinct named items (e.g., Law 1 and Law 2 are never merged even if thematically related)
- **Never strip** `examples`, `practicalApplication`, or `whyItMatters` from expansion results
- Merge only when two topics are genuinely about the same concept with no distinct identity
- Output must preserve the expanded fields from topic expansion, not just a one-line `summary`

New output schema:
```json
{
  "synthesizedTopics": [
    {
      "topicId": "tp_001",
      "title": "Law 1: Never Outshine the Master",
      "summary": "...",
      "keyPoints": [...],
      "examples": [...],
      "practicalApplication": "...",
      "whyItMatters": "..."
    }
  ]
}
```

### 7. Gap Identifier (`gap-identifier.md`)

Stricter completeness criteria:
- If `enumerables.detected` is true and `enumerables.count` is N, coverage is only `complete` when all N items appear in synthesized topics
- Shallow topics (detailedSummary under 2 sentences, fewer than 3 key points) are flagged as `weakTopics`
- Missing examples on high-priority topics are flagged

### 8. Summary Packing (`summary-packing.md` + `constant.ts`)

**Enumerable output structure** (when `enumerables.detected = true`):

```markdown
# Book Summary: [Title]

## Overview
2–3 paragraphs: what the book is, who wrote it, its central argument, and why it matters.

## The [N] [Laws/Rules/Habits/Principles]

### [Label] 1: [Title]
**Core Idea:** ...
**Key Insight:** ...
**In Practice:** ...

### [Label] 2: [Title]
...
(repeat for all N)

## Major Themes
Cross-cutting patterns and ideas that span multiple [laws/chapters/rules].

## Key Takeaways
The most important lessons a reader should remember.

## Actionable Strategies
Concrete ways to apply the book's ideas.

## Final Thought
The book's central message in 2–3 sentences.
```

**Standard output structure** (no enumerables):

```markdown
# Book Summary: [Title]

## Overview

## Core Concepts
### [Concept 1]
Explanation + key points + example + why it matters

### [Concept 2]
...

## Chapter Insights
(if chapter-level data is available and adds value)

## Key Takeaways

## Actionable Insights

## Final Thought
```

---

## Quality Constraints

- For enumerable books: all N items must appear in the final output
- No item should be omitted or grouped with another
- Each item must have: core idea, key insight, and practical note
- The summary must be readable front-to-back as a standalone document
- Internal agent mechanics must never appear in the output

---

## Out of Scope

- UI changes to the upload page beyond the default prompt text
- Changes to how the summary is stored or displayed
- Changes to the voice/chat agents
