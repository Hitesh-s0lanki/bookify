import "server-only";

import { AGENT_NAMES, AGENT_PROMPT_FILES } from "@/modules/agents/constants";
import { invokeBookifyJsonAgent } from "@/modules/agents/base/runtime";
import {
  topicExpansionAgentInputSchema,
  topicExpansionResultSchema,
} from "@/modules/agents/schema";
import { createContextFetchTool } from "@/modules/agents/tools/context-fetch.tool";
import type { TopicExpansionAgentInput } from "@/modules/agents/types";

export async function runTopicExpansionAgent(rawInput: TopicExpansionAgentInput) {
  const input = topicExpansionAgentInputSchema.parse(rawInput);

  return invokeBookifyJsonAgent({
    agentName: AGENT_NAMES.topicExpansion,
    promptFile: AGENT_PROMPT_FILES.topicExpansion,
    runId: input.runId,
    sessionId: input.sessionId,
    input,
    schema: topicExpansionResultSchema,
    tools: [createContextFetchTool(input.bookId)],
  });
}
