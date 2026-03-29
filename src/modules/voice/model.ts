import mongoose, { type InferSchemaType } from "mongoose";

const { model, models, Schema } = mongoose;

const voiceMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  { _id: false }
);

const voiceSessionSchema = new Schema(
  {
    bookId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messages: [voiceMessageSchema],
  },
  { timestamps: true }
);

// 30-day TTL — matches ChatSession
voiceSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export type VoiceMessage = InferSchemaType<typeof voiceMessageSchema>;
export type VoiceSessionDocument = InferSchemaType<typeof voiceSessionSchema>;

export const VoiceSessionModel =
  models.VoiceSession || model("VoiceSession", voiceSessionSchema);
