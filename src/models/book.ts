import { model, models, Schema, type InferSchemaType } from "mongoose";
import { VOICE_PERSONAS } from "@/constants/voice-personas";

const bookSchema = new Schema(
  {
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
      required: true,
      enum: VOICE_PERSONAS,
    },
    vapiAssistantId: {
      type: String,
      default: "",
    },
    contextText: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "ready"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export type BookDocument = InferSchemaType<typeof bookSchema>;

export const BookModel = models.Book || model("Book", bookSchema);
