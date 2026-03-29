import "server-only";

import { AGENT_NAMES, AGENT_PROMPT_FILES } from "@/modules/agents/constants";
import { requirementDiscoveryInputSchema, validatedRequirementSchema } from "@/modules/agents/schema";
import { invokeBookifyJsonAgent } from "@/modules/agents/base/runtime";
import { createContextFetchTool } from "@/modules/agents/tools/context-fetch.tool";
import { createWebSearchTool } from "@/modules/agents/tools/web-search.tool";
import type { RequirementDiscoveryInput } from "@/modules/agents/types";

export async function runRequirementDiscoveryAgent(rawInput: RequirementDiscoveryInput) {
  const input = requirementDiscoveryInputSchema.parse(rawInput);

  return invokeBookifyJsonAgent({
    agentName: AGENT_NAMES.requirementDiscovery,
    promptFile: AGENT_PROMPT_FILES.requirementDiscovery,
    runId: input.runId,
    sessionId: input.sessionId,
    input,
    schema: validatedRequirementSchema,
    tools: [createContextFetchTool(input.bookId), createWebSearchTool()],
  });
}
