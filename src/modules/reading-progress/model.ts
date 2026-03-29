import mongoose, { type InferSchemaType } from "mongoose";

const { model, models, Schema } = mongoose;

const readingProgressSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    bookId: {
      type: String,
      required: true,
      index: true,
    },
    currentPage: {
      type: Number,
      required: true,
      default: 1,
    },
    totalPages: {
      type: Number,
      required: true,
      default: 0,
    },
    lastReadAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

// Enforce one progress record per user per book
readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export type ReadingProgressDocument = InferSchemaType<typeof readingProgressSchema>;

export const ReadingProgressModel =
  models.ReadingProgress || model("ReadingProgress", readingProgressSchema);
