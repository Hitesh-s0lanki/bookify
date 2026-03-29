import "server-only";

import { createDeepAgent } from "deepagents";
import type { ZodType } from "zod";

import { DEFAULT_AGENT_MODEL } from "@/modules/agents/constants";
import { extractTextFromAgentContent } from "@/modules/agents/base/extract-text";
import { parseAgentJson } from "@/modules/agents/base/json";
import { appendAgentConversation, getAgentMemoryWindow } from "@/modules/agents/base/memory";
import { loadAgentPrompt } from "@/modules/agents/base/prompt-loader";
import type { AgentMessage } from "@/modules/agents/types";

type DeepAgentOptions = NonNullable<Parameters<typeof createDeepAgent>[0]>;

export type BookifyAgentTools = DeepAgentOptions["tools"];

type InvokeBookifyAgentOptions = {
  agentName: string;
  promptFile: string;
  runId: string;
  sessionId: string;
  input: string | Record<string, unknown>;
  model?: string;
  tools?: BookifyAgentTools;
};

export async function invokeBookifyAgent({
  agentName,
  promptFile,
  runId,
  sessionId,
  input,
  model,
  tools,
}: InvokeBookifyAgentOptions) {
  const systemPrompt = await loadAgentPrompt(promptFile);
  const memoryWindow = await getAgentMemoryWindow({
    runId,
    sessionId,
    agentName,
  });

  const agent = createDeepAgent({
    model: model ?? DEFAULT_AGENT_MODEL,
    systemPrompt,
    tools,
  });

  const userContent =
    typeof input === "string" ? input.trim() : JSON.stringify(input, null, 2);

  const result = await agent.invoke({
    messages: [
      ...memoryWindow,
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const output = extractTextFromAgentContent(lastMessage?.content);

  if (!output) {
    throw new Error(`${agentName} did not return any text output.`);
  }

  const exchange: AgentMessage[] = [
    { role: "user", content: userContent },
    { role: "assistant", content: output },
  ];

  await appendAgentConversation(
    { runId, sessionId, agentName, systemPrompt },
    exchange
  );

  return output;
}

export async function invokeBookifyJsonAgent<T>(
  options: InvokeBookifyAgentOptions & { schema: ZodType<T> }
) {
  const output = await invokeBookifyAgent(options);

  try {
    return parseAgentJson(output, options.schema);
  } catch (error) {
    const preview = output.slice(0, 800);
    const message =
      error instanceof Error ? error.message : "Unknown JSON parsing error.";

    throw new Error(
      `${options.agentName} returned invalid JSON. ${message}\nResponse preview:\n${preview}`
    );
  }
}
