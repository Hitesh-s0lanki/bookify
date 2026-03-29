import "server-only";

import { gapIdentifierInputSchema } from "@/modules/agents/schema";
import type { GapIdentifierInput } from "@/modules/agents/types";

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function runGapIdentifierAgent(rawInput: GapIdentifierInput) {
  const input = gapIdentifierInputSchema.parse(rawInput);
  const synthesizedKeys = new Set(
    input.synthesizedTopics.map((topic) => normalizeKey(topic.title))
  );

  const missingTopics = input.coverageBlueprint.topics
    .filter((topic) => !synthesizedKeys.has(normalizeKey(topic.title)))
    .map((topic) => ({
      title: topic.title,
      description: topic.description,
    }));

  const weakTopics = input.expansionResults
    .filter(
      (topic) =>
        topic.status !== "done" ||
        topic.detailedSummary.trim().length < 140 ||
        topic.keyPoints.length < 2
    )
    .map((topic) => ({
      topicId: topic.topicId,
      title: topic.title,
      reason:
        topic.status !== "done"
          ? `topic status is ${topic.status}`
          : topic.keyPoints.length < 2
            ? "needs at least two key points"
            : "detailed summary is too shallow",
    }));

  const status =
    missingTopics.length === 0 && weakTopics.length === 0
      ? ("complete" as const)
      : ("incomplete" as const);

  return {
    status,
    missingTopics,
    weakTopics,
    nextAction:
      status === "complete"
        ? ("complete" as const)
        : ("redispatch" as const),
  };
}
