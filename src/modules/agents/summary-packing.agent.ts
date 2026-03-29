import "server-only";

import { AGENT_NAMES, AGENT_PROMPT_FILES } from "@/modules/agents/constants";
import { invokeBookifyAgent } from "@/modules/agents/base/runtime";
import { FinalSummaryModel } from "@/modules/agents/models";
import { summaryPackingInputSchema } from "@/modules/agents/schema";
import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";
import type { FinalSummary, SummaryPackingInput } from "@/modules/agents/types";

function normalizeFinalSummaryContent(content: string) {
  return content
    .replace(/^#\s+Book Summary\s*\n+/i, "")
    .replace(/^#\s+Quick Summary\s*\n+/i, "")
    .trim();
}

export async function runSummaryPackingAgent(rawInput: SummaryPackingInput) {
  const input = summaryPackingInputSchema.parse(rawInput);

  const rawContent = await invokeBookifyAgent({
    agentName: AGENT_NAMES.summaryPacking,
    promptFile: AGENT_PROMPT_FILES.summaryPacking,
    runId: input.runId,
    sessionId: input.sessionId,
    input,
  });
  const content = normalizeFinalSummaryContent(rawContent);

  const finalSummary: FinalSummary = {
    title: `Book Summary - ${input.bookTitle}`,
    format: "markdown",
    content,
    createdBy: AGENT_NAMES.summaryPacking,
  };

  await connectToDatabase();

  await FinalSummaryModel.findOneAndUpdate(
    { runId: input.runId },
    {
      $set: {
        runId: input.runId,
        bookId: input.bookId,
        userId: input.userId,
        title: finalSummary.title,
        format: finalSummary.format,
        content: finalSummary.content,
        createdBy: finalSummary.createdBy,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );

  await BookModel.updateOne(
    { _id: input.bookId },
    {
      $set: {
        summary: content,
        summaryPrompt: input.userRequest,
      },
    },
  );

  return finalSummary;
}
