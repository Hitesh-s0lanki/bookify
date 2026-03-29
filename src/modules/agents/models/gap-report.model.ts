import "server-only";

import mongoose, { type InferSchemaType } from "mongoose";

import {
  missingTopicSubSchema,
  weakTopicSubSchema,
} from "@/modules/agents/models/shared";

const { model, models, Schema } = mongoose;

const gapReportSchema = new Schema(
  {
    runId: { type: String, required: true },
    bookId: { type: String, required: true },
    status: {
      type: String,
      enum: ["complete", "incomplete"],
      required: true,
    },
    missingTopics: { type: [missingTopicSubSchema], default: [] },
    weakTopics: { type: [weakTopicSubSchema], default: [] },
    recommendedAction: {
      type: String,
      enum: ["complete", "redispatch"],
      default: "complete",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

gapReportSchema.index({ runId: 1 });

export type GapReportDocument = InferSchemaType<typeof gapReportSchema>;

export const GapReportModel =
  models.GapReport || model("GapReport", gapReportSchema);
