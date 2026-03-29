import mongoose, { type InferSchemaType } from "mongoose";
import { VOICE_PERSONAS } from "./constants";

const { model, models, Schema } = mongoose;

const bookSchema = new Schema(
  {
    userId: {
      type: String,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    genre: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    coverUrl: {
      type: String,
      default: "",
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    voicePersona: {
      type: String,
      required: false,
      enum: VOICE_PERSONAS,
    },
    vapiAssistantId: {
      type: String,
      default: "",
    },
    pdfBuffer: {
      type: Buffer,
      default: null,
      select: false,
    },
    contextText: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: null,
    },
    summaryPrompt: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "ready", "UPLOADED", "PROCESSING", "READY", "FAILED"],
      default: "pending",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export type BookDocument = InferSchemaType<typeof bookSchema>;

export const BookModel = models.Book || model("Book", bookSchema);
