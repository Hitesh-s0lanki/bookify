import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

const { model, models, Schema } = mongoose;

const finalSummarySchema = new Schema(
  {
    runId: { type: String, required: true, index: true },
    bookId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    format: { type: String, enum: ["markdown"], default: "markdown" },
    content: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

finalSummarySchema.index({ userId: 1, bookId: 1, createdAt: -1 });

export type FinalSummaryDocument = InferSchemaType<typeof finalSummarySchema>;

export const FinalSummaryModel =
  models.FinalSummary || model("FinalSummary", finalSummarySchema);
