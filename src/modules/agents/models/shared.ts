import "server-only";

import mongoose from "mongoose";

const { Schema } = mongoose;

export const agentMessageSubSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["system", "user", "assistant", "tool"],
      required: true,
    },
    content: { type: String, required: true },
  },
  { _id: false }
);

export const coverageTopicSubSchema = new Schema(
  {
    topicId: { type: String, default: null },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
  },
  { _id: false }
);

export const topicExpansionResultSubSchema = new Schema(
  {
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
  { _id: false }
);

export const synthesizedTopicSubSchema = new Schema(
  {
    topicId: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
  },
  { _id: false }
);

export const missingTopicSubSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

export const weakTopicSubSchema = new Schema(
  {
    topicId: { type: String, required: true },
    title: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);
