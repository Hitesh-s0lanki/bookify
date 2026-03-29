import "server-only";

import { AGENT_LIMITS } from "@/modules/agents/constants";
import { connectToDatabase } from "@/lib/db";
import { AgentConversationModel, AgentMemoryWindowModel } from "@/modules/agents/models";
import type { AgentMessage } from "@/modules/agents/types";

type AgentMemoryKey = {
  runId: string;
  sessionId: string;
  agentName: string;
};

export async function getAgentMemoryWindow(key: AgentMemoryKey) {
  await connectToDatabase();

  const window = await AgentMemoryWindowModel.findOne(key).lean();
  return (window?.last5Messages ?? []).filter(
    (message: AgentMessage): message is AgentMessage =>
      message.role === "user" || message.role === "assistant"
  );
}

export async function appendAgentConversation(
  key: AgentMemoryKey & { systemPrompt?: string },
  exchange: AgentMessage[]
) {
  await connectToDatabase();

  const existingConversation = await AgentConversationModel.findOne(key).lean();
  const nextMessages: AgentMessage[] = [];

  if (!existingConversation && key.systemPrompt) {
    nextMessages.push({
      role: "system",
      content: key.systemPrompt,
    });
  }

  nextMessages.push(...exchange);

  const conversation = await AgentConversationModel.findOneAndUpdate(
    {
      runId: key.runId,
      sessionId: key.sessionId,
      agentName: key.agentName,
    },
    {
      $push: {
        messages: {
          $each: nextMessages,
        },
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  const last5Messages = (conversation.messages ?? [])
    .filter(
      (message: AgentMessage) =>
        message.role === "user" || message.role === "assistant"
    )
    .slice(-AGENT_LIMITS.memoryWindowSize) as AgentMessage[];

  await AgentMemoryWindowModel.findOneAndUpdate(
    {
      runId: key.runId,
      sessionId: key.sessionId,
      agentName: key.agentName,
    },
    {
      $set: {
        last5Messages,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );
}
