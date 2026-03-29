import "server-only";

import { z } from "zod";

import {
  AGENT_LIMITS,
  AGENT_NAMES,
  SUMMARY_RUN_STAGES,
  SUMMARY_RUN_STATUSES,
} from "@/modules/agents/constants";

export const agentNameSchema = z.enum([
  AGENT_NAMES.supervisor,
  AGENT_NAMES.requirementDiscovery,
  AGENT_NAMES.coverageBlueprint,
  AGENT_NAMES.topicDispatch,
  AGENT_NAMES.topicExpansion,
  AGENT_NAMES.topicSynthesis,
  AGENT_NAMES.gapIdentifier,
  AGENT_NAMES.summaryPacking,
]);

export const summaryRunStageSchema = z.enum(SUMMARY_RUN_STAGES);
export const summaryRunStatusSchema = z.enum(SUMMARY_RUN_STATUSES);

export const validatedRequirementSchema = z.object({
  goal: z.string().min(1),
  focus: z.array(z.string()).default([]),
  style: z.string().default("clear"),
  length: z.string().default("comprehensive"),
  format: z.string().default("markdown"),
  audience: z.string().optional(),
  tone: z.string().optional(),
  exclusions: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  language: z.string().default("en"),
  detectEnumerables: z.boolean().default(true),
});

export const coverageTopicSchema = z.object({
  topicId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

export const coverageBlueprintSchema = z.object({
  requiredChapters: z.array(z.number().int().positive()).default([]),
  topics: z.array(coverageTopicSchema).max(AGENT_LIMITS.maxTopics),
  enumerables: z
    .object({
      detected: z.boolean(),
      type: z.string(),
      count: z.number().int().nonnegative(),
      label: z.string(),
    })
    .optional(),
});

export const topicDispatchJobSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

export const topicDispatchOutputSchema = z.object({
  totalTopics: z.number().int().nonnegative(),
  batchSize: z.number().int().positive(),
  batches: z.array(z.array(topicDispatchJobSchema)),
});

export const topicExpansionInputSchema = z.object({
  batchId: z.string().min(1),
  topics: z.array(topicDispatchJobSchema).min(1),
});

export const topicExpansionResultItemSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(1),
  detailedSummary: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  practicalApplication: z.string().optional(),
  whyItMatters: z.string().optional(),
  relatedChapters: z.array(z.number().int().positive()).default([]),
  status: z.enum(["done", "needs_retry", "failed"]).default("done"),
});

export const topicExpansionResultSchema = z.object({
  batchId: z.string().min(1),
  results: z.array(topicExpansionResultItemSchema),
});

export const synthesizedTopicSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  practicalApplication: z.string().optional(),
  whyItMatters: z.string().optional(),
});

export const topicSynthesisResultSchema = z.object({
  synthesizedTopics: z.array(synthesizedTopicSchema),
});

export const missingTopicSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

export const weakTopicSchema = z.object({
  topicId: z.string().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
});

export const gapIdentifierResultSchema = z.object({
  status: z.enum(["complete", "incomplete"]),
  missingTopics: z.array(missingTopicSchema).default([]),
  weakTopics: z.array(weakTopicSchema).default([]),
  nextAction: z.enum(["complete", "redispatch"]).optional(),
});

export const agentMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().min(1),
});

export const summaryPackingInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  bookId: z.string().min(1),
  userRequest: z.string().min(1),
  bookTitle: z.string().min(1),
  bookAuthor: z.string().min(1),
  validatedRequirement: validatedRequirementSchema,
  coverageBlueprint: coverageBlueprintSchema,
  synthesizedTopics: z.array(synthesizedTopicSchema),
  gapReports: z.array(gapIdentifierResultSchema).default([]),
  topicExpansions: z.array(topicExpansionResultItemSchema).default([]),
  supportingContext: z
    .object({
      coverageNotes: z.array(z.string()).default([]),
      groundingNotes: z.array(z.string()).default([]),
      recoveryNotes: z.array(z.string()).default([]),
      chapterSummaries: z.array(z.string()).default([]),
      evidenceBundle: z.array(z.string()).default([]),
    })
    .default({
      coverageNotes: [],
      groundingNotes: [],
      recoveryNotes: [],
      chapterSummaries: [],
      evidenceBundle: [],
    }),
});

export const finalSummarySchema = z.object({
  title: z.string().min(1),
  format: z.literal("markdown"),
  content: z.string().min(1),
  createdBy: z.literal(AGENT_NAMES.summaryPacking).default(
    AGENT_NAMES.summaryPacking
  ),
});

export const summarySupervisorInputSchema = z.object({
  userId: z.string().min(1),
  bookId: z.string().min(1),
  userRequest: z.string().min(1),
  sessionId: z.string().optional(),
  maxLoops: z
    .number()
    .int()
    .positive()
    .max(AGENT_LIMITS.maxLoops)
    .default(AGENT_LIMITS.maxLoops),
  topicExpansionConcurrency: z
    .number()
    .int()
    .positive()
    .default(AGENT_LIMITS.defaultTopicExpansionConcurrency),
});

export const requirementDiscoveryInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  userRequest: z.string().min(1),
  bookId: z.string().min(1),
  bookTitle: z.string().min(1),
  bookAuthor: z.string().min(1),
  existingContext: z.string().optional(),
});

export const coverageBlueprintInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  bookId: z.string().min(1),
  bookTitle: z.string().min(1),
  bookAuthor: z.string().min(1),
  validatedRequirement: validatedRequirementSchema,
  contextNotes: z.array(z.string()).default([]),
});

export const topicDispatchInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  topics: z.array(coverageTopicSchema).max(AGENT_LIMITS.maxTopics),
  batchSize: z
    .number()
    .int()
    .positive()
    .default(AGENT_LIMITS.topicBatchSize),
});

export const topicExpansionAgentInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  bookId: z.string().min(1),
  bookTitle: z.string().min(1),
  bookAuthor: z.string().min(1),
  validatedRequirement: validatedRequirementSchema,
  batch: topicExpansionInputSchema,
});

export const topicSynthesisInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  bookId: z.string().min(1),
  bookTitle: z.string().min(1),
  bookAuthor: z.string().min(1),
  validatedRequirement: validatedRequirementSchema,
  expansionResults: z.array(topicExpansionResultItemSchema),
});

export const gapIdentifierInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  bookId: z.string().min(1),
  validatedRequirement: validatedRequirementSchema,
  coverageBlueprint: coverageBlueprintSchema,
  synthesizedTopics: z.array(synthesizedTopicSchema),
  expansionResults: z.array(topicExpansionResultItemSchema),
});

export const supervisorValidationInputSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  userRequest: z.string().min(1),
  candidateRequirement: validatedRequirementSchema,
});
