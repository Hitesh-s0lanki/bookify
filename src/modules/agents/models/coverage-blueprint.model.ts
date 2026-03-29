import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

import { coverageTopicSubSchema } from "@/modules/agents/models/shared";

const { model, models, Schema } = mongoose;

const coverageBlueprintSchema = new Schema(
  {
    runId: { type: String, required: true },
    bookId: { type: String, required: true },
    requiredChapters: { type: [Number], default: [] },
    topics: { type: [coverageTopicSubSchema], default: [] },
    topicCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

coverageBlueprintSchema.index({ runId: 1 });

export type CoverageBlueprintDocument = InferSchemaType<
  typeof coverageBlueprintSchema
>;

export const CoverageBlueprintModel =
  models.CoverageBlueprint ||
  model("CoverageBlueprint", coverageBlueprintSchema);
