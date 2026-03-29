import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

const { model, models, Schema } = mongoose;

const topicExpansionSchema = new Schema(
  {
    runId: { type: String, required: true, index: true },
    bookId: { type: String, required: true },
    batchId: { type: String, required: true },
    topicId: { type: String, required: true },
    title: { type: String, required: true },
    detailedSummary: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    relatedChapters: { type: [Number], default: [] },
    status: {
      type: String,
      enum: ["done", "needs_retry", "failed"],
      default: "done",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

topicExpansionSchema.index({ runId: 1, topicId: 1 });
topicExpansionSchema.index({ batchId: 1 });

export type TopicExpansionDocument = InferSchemaType<typeof topicExpansionSchema>;

export const TopicExpansionModel =
  models.TopicExpansion || model("TopicExpansion", topicExpansionSchema);
