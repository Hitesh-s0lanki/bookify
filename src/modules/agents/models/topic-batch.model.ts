import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

import { coverageTopicSubSchema } from "@/modules/agents/models/shared";

const { model, models, Schema } = mongoose;

const topicBatchSchema = new Schema(
  {
    runId: { type: String, required: true, index: true },
    bookId: { type: String, required: true },
    batchId: { type: String, required: true },
    batchNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
      index: true,
    },
    topics: { type: [coverageTopicSubSchema], default: [] },
    attempts: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

topicBatchSchema.index({ runId: 1, status: 1 });
topicBatchSchema.index({ batchNumber: 1 });

export type TopicBatchDocument = InferSchemaType<typeof topicBatchSchema>;

export const TopicBatchModel =
  models.TopicBatch || model("TopicBatch", topicBatchSchema);
