import type { z } from "zod";

import type {
  agentMessageSchema,
  coverageBlueprintInputSchema,
  coverageBlueprintSchema,
  coverageTopicSchema,
  finalSummarySchema,
  gapIdentifierInputSchema,
  gapIdentifierResultSchema,
  requirementDiscoveryInputSchema,
  summaryPackingInputSchema,
  summaryRunStageSchema,
  summaryRunStatusSchema,
  summarySupervisorInputSchema,
  supervisorValidationInputSchema,
  synthesizedTopicSchema,
  topicDispatchInputSchema,
  topicDispatchJobSchema,
  topicDispatchOutputSchema,
  topicExpansionAgentInputSchema,
  topicExpansionInputSchema,
  topicExpansionResultItemSchema,
  topicExpansionResultSchema,
  topicSynthesisInputSchema,
  topicSynthesisResultSchema,
  validatedRequirementSchema,
  weakTopicSchema,
  missingTopicSchema,
} from "@/modules/agents/schema";

export type AgentMessage = z.infer<typeof agentMessageSchema>;
export type ValidatedRequirement = z.infer<typeof validatedRequirementSchema>;
export type CoverageTopic = z.infer<typeof coverageTopicSchema>;
export type CoverageBlueprint = z.infer<typeof coverageBlueprintSchema>;
export type TopicDispatchJob = z.infer<typeof topicDispatchJobSchema>;
export type TopicDispatchOutput = z.infer<typeof topicDispatchOutputSchema>;
export type TopicExpansionInput = z.infer<typeof topicExpansionInputSchema>;
export type TopicExpansionResultItem = z.infer<
  typeof topicExpansionResultItemSchema
>;
export type TopicExpansionResult = z.infer<typeof topicExpansionResultSchema>;
export type SynthesizedTopic = z.infer<typeof synthesizedTopicSchema>;
export type TopicSynthesisResult = z.infer<typeof topicSynthesisResultSchema>;
export type MissingTopic = z.infer<typeof missingTopicSchema>;
export type WeakTopic = z.infer<typeof weakTopicSchema>;
export type GapIdentifierResult = z.infer<typeof gapIdentifierResultSchema>;
export type SummaryPackingInput = z.infer<typeof summaryPackingInputSchema>;
export type FinalSummary = z.infer<typeof finalSummarySchema>;
export type SummaryRunStage = z.infer<typeof summaryRunStageSchema>;
export type SummaryRunStatus = z.infer<typeof summaryRunStatusSchema>;
export type SummarySupervisorInput = z.infer<typeof summarySupervisorInputSchema>;
export type RequirementDiscoveryInput = z.infer<
  typeof requirementDiscoveryInputSchema
>;
export type CoverageBlueprintInput = z.infer<
  typeof coverageBlueprintInputSchema
>;
export type TopicDispatchInput = z.infer<typeof topicDispatchInputSchema>;
export type TopicExpansionAgentInput = z.infer<
  typeof topicExpansionAgentInputSchema
>;
export type TopicSynthesisInput = z.infer<typeof topicSynthesisInputSchema>;
export type GapIdentifierInput = z.infer<typeof gapIdentifierInputSchema>;
export type SupervisorValidationInput = z.infer<
  typeof supervisorValidationInputSchema
>;
