import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

import { synthesizedTopicSubSchema } from "@/modules/agents/models/shared";

const { model, models, Schema } = mongoose;

const topicSynthesisSchema = new Schema(
  {
    runId: { type: String, required: true, index: true },
    bookId: { type: String, required: true },
    synthesizedTopics: { type: [synthesizedTopicSubSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type TopicSynthesisDocument = InferSchemaType<typeof topicSynthesisSchema>;

export const TopicSynthesisModel =
  models.TopicSynthesis || model("TopicSynthesis", topicSynthesisSchema);
