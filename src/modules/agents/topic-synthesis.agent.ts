import "server-only";

import { topicSynthesisInputSchema } from "@/modules/agents/schema";
import type { TopicSynthesisInput } from "@/modules/agents/types";

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function condenseSummary(text: string) {
  const trimmed = text.trim();
  if (trimmed.length <= 800) {
    return trimmed;
  }
  // Preserve at least 3 sentences when truncating
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) ?? [];
  if (sentences.length >= 3) {
    const threeSentences = sentences.slice(0, 3).join(" ").trim();
    if (threeSentences.length <= 900) return threeSentences;
  }
  return `${trimmed.slice(0, 797).trim()}...`;
}

export async function runTopicSynthesisAgent(rawInput: TopicSynthesisInput) {
  const input = topicSynthesisInputSchema.parse(rawInput);
  const groupedTopics = new Map<
    string,
    {
      topicId: string;
      title: string;
      summaries: string[];
      keyPoints: string[];
      examples: string[];
      practicalApplication: string | undefined;
      whyItMatters: string | undefined;
    }
  >();

  for (const result of input.expansionResults) {
    const key = normalizeKey(result.title);
    const existing = groupedTopics.get(key);

    if (existing) {
      existing.summaries.push(result.detailedSummary);
      for (const kp of result.keyPoints) {
        if (!existing.keyPoints.includes(kp)) {
          existing.keyPoints.push(kp);
        }
      }
      for (const ex of result.examples) {
        if (!existing.examples.includes(ex)) {
          existing.examples.push(ex);
        }
      }
      if (!existing.practicalApplication && result.practicalApplication) {
        existing.practicalApplication = result.practicalApplication;
      }
      if (!existing.whyItMatters && result.whyItMatters) {
        existing.whyItMatters = result.whyItMatters;
      }
      continue;
    }

    groupedTopics.set(key, {
      topicId: result.topicId,
      title: result.title.trim(),
      summaries: [result.detailedSummary],
      keyPoints: [...result.keyPoints],
      examples: [...result.examples],
      practicalApplication: result.practicalApplication,
      whyItMatters: result.whyItMatters,
    });
  }

  return {
    synthesizedTopics: [...groupedTopics.values()].map((topic) => ({
      topicId: topic.topicId,
      title: topic.title,
      summary: condenseSummary(topic.summaries[0] ?? ""),
      keyPoints: topic.keyPoints.slice(0, 8),
      examples: topic.examples,
      practicalApplication: topic.practicalApplication,
      whyItMatters: topic.whyItMatters,
    })),
  };
}
