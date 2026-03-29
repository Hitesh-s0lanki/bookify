import { model, models, Schema, type InferSchemaType } from "mongoose";

const storedMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    reasoning: { type: String, default: null },
    toolCalls: [
      {
        toolName: { type: String },
        args: { type: Schema.Types.Mixed },
      },
    ],
  },
  { _id: false }
);

const chatSessionSchema = new Schema(
  {
    bookId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    messages: [storedMessageSchema],
  },
  { timestamps: true }
);

// 30-day TTL on updatedAt
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export type StoredMessage = InferSchemaType<typeof storedMessageSchema>;
export type ChatSessionDocument = InferSchemaType<typeof chatSessionSchema>;

export const ChatSessionModel =
  models.ChatSession || model("ChatSession", chatSessionSchema);
