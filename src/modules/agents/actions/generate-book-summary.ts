import "server-only";

import { AGENT_LIMITS } from "@/modules/agents/constants";
import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";
import { runBookSummarySupervisor } from "@/modules/agents/supervisor.agent";
import { DEFAULT_BOOK_SUMMARY_REQUEST } from "@/modules/summary/default-request";

export async function generateBookSummaryForProcessedBook(params: {
  bookId: string;
  userRequest?: string;
}) {
  await connectToDatabase();

  const book = await BookModel.findById(params.bookId)
    .select("userId summaryPrompt")
    .lean();

  if (!book) {
    throw new Error(`Book ${params.bookId} not found for summary generation.`);
  }

  const userRequest =
    params.userRequest?.trim() ||
    book.summaryPrompt?.trim() ||
    DEFAULT_BOOK_SUMMARY_REQUEST;

  const userId = book.userId?.trim() || "system";

  try {
    return await runBookSummarySupervisor({
      userId,
      bookId: params.bookId,
      userRequest,
      maxLoops: AGENT_LIMITS.maxLoops,
      topicExpansionConcurrency: AGENT_LIMITS.defaultTopicExpansionConcurrency,
    });
  } catch (error) {
    console.error(
      `[summary] Failed to generate summary for book ${params.bookId}:`,
      error
    );
    return null;
  }
}
