import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

import { agentMessageSubSchema } from "@/modules/agents/models/shared";

const { model, models, Schema } = mongoose;

const agentConversationSchema = new Schema(
  {
    runId: { type: String, required: true },
    sessionId: { type: String, required: true },
    agentName: { type: String, required: true },
    messages: { type: [agentMessageSubSchema], default: [] },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

agentConversationSchema.index({ runId: 1, sessionId: 1, agentName: 1 }, { unique: true });

export type AgentConversationDocument = InferSchemaType<
  typeof agentConversationSchema
>;

export const AgentConversationModel =
  models.AgentConversation ||
  model("AgentConversation", agentConversationSchema);
