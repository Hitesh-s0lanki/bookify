import "server-only";

import { topicSynthesisInputSchema } from "@/modules/agents/schema";
import type { TopicSynthesisInput } from "@/modules/agents/types";

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function condenseSummary(text: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 280) {
    return trimmed;
  }

  const sentenceMatch = trimmed.match(/^(.{120,280}?[.!?])\s/);
  return sentenceMatch?.[1]?.trim() ?? `${trimmed.slice(0, 277).trim()}...`;
}

export async function runTopicSynthesisAgent(rawInput: TopicSynthesisInput) {
  const input = topicSynthesisInputSchema.parse(rawInput);
  const groupedTopics = new Map<
    string,
    {
      topicId: string;
      title: string;
      summaries: string[];
    }
  >();

  for (const result of input.expansionResults) {
    const key = normalizeKey(result.title);
    const existing = groupedTopics.get(key);

    if (existing) {
      existing.summaries.push(result.detailedSummary);
      continue;
    }

    groupedTopics.set(key, {
      topicId: result.topicId,
      title: result.title.trim(),
      summaries: [result.detailedSummary],
    });
  }

  return {
    synthesizedTopics: [...groupedTopics.values()].map((topic) => ({
      topicId: topic.topicId,
      title: topic.title,
      summary: condenseSummary(topic.summaries[0] ?? ""),
      keyPoints: [],
      examples: [],
    })),
  };
}
