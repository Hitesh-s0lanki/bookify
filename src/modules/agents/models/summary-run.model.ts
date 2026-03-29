import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

import { SUMMARY_RUN_STAGES, SUMMARY_RUN_STATUSES } from "@/modules/agents/constants";

const { model, models, Schema } = mongoose;

const summaryRunSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    bookId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: SUMMARY_RUN_STATUSES,
      default: "pending",
      index: true,
    },
    userRequest: { type: String, required: true },
    validatedRequirement: { type: Schema.Types.Mixed, default: null },
    currentStage: {
      type: String,
      enum: SUMMARY_RUN_STAGES,
      default: "requirement_discovery",
    },
    loopCount: { type: Number, default: 0 },
    maxLoops: { type: Number, default: 4 },
  },
  { timestamps: true }
);

summaryRunSchema.index({ userId: 1, createdAt: -1 });
summaryRunSchema.index({ bookId: 1, status: 1 });

export type SummaryRunDocument = InferSchemaType<typeof summaryRunSchema>;

export const SummaryRunModel =
  models.SummaryRun || model("SummaryRun", summaryRunSchema);
