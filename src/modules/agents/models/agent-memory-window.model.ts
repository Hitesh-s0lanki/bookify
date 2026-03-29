import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

import { agentMessageSubSchema } from "@/modules/agents/models/shared";

const { model, models, Schema } = mongoose;

const agentMemoryWindowSchema = new Schema(
  {
    runId: { type: String, required: true },
    sessionId: { type: String, required: true },
    agentName: { type: String, required: true },
    last5Messages: { type: [agentMessageSubSchema], default: [] },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

agentMemoryWindowSchema.index(
  { runId: 1, sessionId: 1, agentName: 1 },
  { unique: true }
);

export type AgentMemoryWindowDocument = InferSchemaType<
  typeof agentMemoryWindowSchema
>;

export const AgentMemoryWindowModel =
  models.AgentMemoryWindow ||
  model("AgentMemoryWindow", agentMemoryWindowSchema);
