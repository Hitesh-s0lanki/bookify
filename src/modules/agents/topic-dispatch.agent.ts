import "server-only";

import { AGENT_LIMITS } from "@/modules/agents/constants";
import { topicDispatchInputSchema } from "@/modules/agents/schema";
import type { TopicDispatchInput } from "@/modules/agents/types";

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

function normalizeKey(title: string) {
  return normalizeTitle(title).toLowerCase();
}

function priorityWeight(priority?: string) {
  switch (priority) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
    default:
      return 1;
  }
}

export async function runTopicDispatchAgent(rawInput: TopicDispatchInput) {
  const input = topicDispatchInputSchema.parse(rawInput);
  const dedupedTopics = [...input.topics]
    .slice(0, AGENT_LIMITS.maxTopics)
    .reduce<typeof input.topics>((accumulator, topic) => {
      const normalizedTitle = normalizeTitle(topic.title);
      const key = normalizeKey(normalizedTitle);
      const existing = accumulator.find(
        (item) => normalizeKey(item.title) === key
      );

      if (existing) {
        if (
          priorityWeight(topic.priority) < priorityWeight(existing.priority)
        ) {
          existing.priority = topic.priority;
        }
        return accumulator;
      }

      accumulator.push({
        ...topic,
        title: normalizedTitle,
      });
      return accumulator;
    }, [])
    .map((topic, index) => ({
      topicId: topic.topicId?.trim() || `tp_${String(index + 1).padStart(3, "0")}`,
      title: topic.title,
      description: topic.description.trim(),
      priority: topic.priority ?? "medium",
    }))
    .sort((left, right) => {
      const priorityDiff =
        priorityWeight(left.priority) - priorityWeight(right.priority);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.title.localeCompare(right.title);
    });

  const batchSize = Math.max(1, input.batchSize || AGENT_LIMITS.topicBatchSize);
  const batches = [];

  for (let index = 0; index < dedupedTopics.length; index += batchSize) {
    batches.push(dedupedTopics.slice(index, index + batchSize));
  }

  return {
    totalTopics: dedupedTopics.length,
    batchSize,
    batches,
  };
}
