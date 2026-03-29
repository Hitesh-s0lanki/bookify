import "server-only";

export const AGENT_NAMES = {
  supervisor: "supervisor_agent",
  requirementDiscovery: "requirement_discovery_agent",
  coverageBlueprint: "coverage_blueprint_agent",
  topicDispatch: "topic_dispatch_agent",
  topicExpansion: "topic_expansion_agent",
  topicSynthesis: "topic_synthesis_agent",
  gapIdentifier: "gap_identifier_agent",
  summaryPacking: "summary_packing_agent",
} as const;

export const AGENT_PROMPT_FILES = {
  supervisor: "supervisor.md",
  requirementDiscovery: "requirement-discovery.md",
  coverageBlueprint: "coverage-blueprint.md",
  topicDispatch: "topic-dispatch.md",
  topicExpansion: "topic-expansion.md",
  topicSynthesis: "topic-synthesis.md",
  gapIdentifier: "gap-identifier.md",
  summaryPacking: "summary-packing.md",
} as const;

export const DEFAULT_AGENT_MODEL =
  process.env.BOOKIFY_AGENT_MODEL ?? "openai:gpt-4o-mini";

export const AGENT_LIMITS = {
  maxTopics: 100,
  topicBatchSize: 5,
  maxLoops: 4,
  maxRetryPerBatch: 2,
  memoryWindowSize: 5,
  defaultTopicExpansionConcurrency: 3,
} as const;

export const SUMMARY_RUN_STAGES = [
  "requirement_discovery",
  "requirement_validation",
  "coverage_blueprint",
  "topic_dispatch",
  "topic_expansion",
  "topic_synthesis",
  "gap_identifier",
  "summary_packing",
  "completed",
  "failed",
] as const;

export const SUMMARY_RUN_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "failed",
] as const;
