import "server-only";

import { AGENT_NAMES, AGENT_PROMPT_FILES } from "@/modules/agents/constants";
import { invokeBookifyJsonAgent } from "@/modules/agents/base/runtime";
import {
  coverageBlueprintInputSchema,
  coverageBlueprintSchema,
} from "@/modules/agents/schema";
import { createContextFetchTool } from "@/modules/agents/tools/context-fetch.tool";
import type { CoverageBlueprintInput } from "@/modules/agents/types";

export async function runCoverageBlueprintAgent(rawInput: CoverageBlueprintInput) {
  const input = coverageBlueprintInputSchema.parse(rawInput);

  return invokeBookifyJsonAgent({
    agentName: AGENT_NAMES.coverageBlueprint,
    promptFile: AGENT_PROMPT_FILES.coverageBlueprint,
    runId: input.runId,
    sessionId: input.sessionId,
    input,
    schema: coverageBlueprintSchema,
    tools: [createContextFetchTool()],
  });
}
