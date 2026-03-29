import "server-only";

import { AGENT_LIMITS, AGENT_NAMES, AGENT_PROMPT_FILES } from "@/modules/agents/constants";
import {
  CoverageBlueprintModel,
  GapReportModel,
  SummaryRunModel,
  TopicBatchModel,
  TopicExpansionModel,
  TopicSynthesisModel,
} from "@/modules/agents/models";
import {
  summarySupervisorInputSchema,
  validatedRequirementSchema,
} from "@/modules/agents/schema";
import type {
  CoverageTopic,
  FinalSummary,
  GapIdentifierResult,
  SummarySupervisorInput,
  SynthesizedTopic,
  TopicDispatchJob,
  TopicExpansionInput,
  TopicExpansionResultItem,
  ValidatedRequirement,
} from "@/modules/agents/types";
import { invokeBookifyJsonAgent } from "@/modules/agents/base/runtime";
import { connectToDatabase } from "@/lib/db";
import { BookModel } from "@/modules/books/model";
import { runCoverageBlueprintAgent } from "@/modules/agents/coverage-blueprint.agent";
import { runGapIdentifierAgent } from "@/modules/agents/gap-identifier.agent";
import { runRequirementDiscoveryAgent } from "@/modules/agents/requirement-discovery.agent";
import { runSummaryPackingAgent } from "@/modules/agents/summary-packing.agent";
import { runTopicDispatchAgent } from "@/modules/agents/topic-dispatch.agent";
import { runTopicExpansionAgent } from "@/modules/agents/topic-expansion.agent";
import { runTopicSynthesisAgent } from "@/modules/agents/topic-synthesis.agent";

function normalizeTopicKey(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeTopics(topics: CoverageTopic[]) {
  const seen = new Set<string>();
  const deduped: CoverageTopic[] = [];

  for (const topic of topics) {
    const key = topic.topicId?.trim() || normalizeTopicKey(topic.title);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(topic);
  }

  return deduped.slice(0, AGENT_LIMITS.maxTopics);
}

function normalizeRequirement(requirement: ValidatedRequirement): ValidatedRequirement {
  return validatedRequirementSchema.parse({
    ...requirement,
    format: requirement.format || "markdown",
    length: requirement.length || "medium",
    style: requirement.style || "clear",
    focus: requirement.focus ?? [],
    constraints: requirement.constraints ?? [],
    exclusions: requirement.exclusions ?? [],
    language: requirement.language || "en",
  });
}

function materializeBatchInputs(dispatchJobs: TopicDispatchJob[][]) {
  return dispatchJobs.map<TopicExpansionInput>((topics, index) => ({
    batchId: `batch_${String(index + 1).padStart(3, "0")}`,
    topics,
  }));
}

function buildRedispatchTopics(params: {
  gapReport: GapIdentifierResult;
  originalTopics: CoverageTopic[];
  expansionMap: Map<string, TopicExpansionResultItem>;
}) {
  const byId = new Map(params.originalTopics.map((topic) => [topic.topicId, topic]));
  const byTitle = new Map(
    params.originalTopics.map((topic) => [normalizeTopicKey(topic.title), topic])
  );

  const nextTopics: CoverageTopic[] = [];

  for (const missingTopic of params.gapReport.missingTopics) {
    nextTopics.push({
      title: missingTopic.title,
      description: missingTopic.description,
      priority: "high",
    });
  }

  for (const weakTopic of params.gapReport.weakTopics) {
    const fromId = byId.get(weakTopic.topicId);
    const fromTitle = byTitle.get(normalizeTopicKey(weakTopic.title));
    const existingExpansion = params.expansionMap.get(weakTopic.topicId);

    nextTopics.push({
      topicId: weakTopic.topicId,
      title: weakTopic.title,
      description:
        fromId?.description ||
        fromTitle?.description ||
        existingExpansion?.detailedSummary ||
        weakTopic.reason,
      priority: "high",
    });
  }

  return dedupeTopics(nextTopics);
}

async function updateSummaryRun(
  runId: string,
  updates: Record<string, unknown>
) {
  await SummaryRunModel.findByIdAndUpdate(runId, {
    $set: updates,
  });
}

async function persistTopicBatches(params: {
  runId: string;
  bookId: string;
  batches: TopicExpansionInput[];
}) {
  if (params.batches.length === 0) {
    return;
  }

  await TopicBatchModel.bulkWrite(
    params.batches.map((batch, index) => ({
      updateOne: {
        filter: { runId: params.runId, batchId: batch.batchId },
        update: {
          $set: {
            runId: params.runId,
            bookId: params.bookId,
            batchId: batch.batchId,
            batchNumber: index + 1,
            status: "pending",
            topics: batch.topics,
          },
          $setOnInsert: {
            attempts: 0,
            startedAt: null,
            completedAt: null,
          },
        },
        upsert: true,
      },
    }))
  );
}

async function persistExpansionResults(params: {
  runId: string;
  bookId: string;
  batchId: string;
  results: TopicExpansionResultItem[];
}) {
  if (params.results.length === 0) {
    return;
  }

  await TopicExpansionModel.bulkWrite(
    params.results.map((result) => ({
      updateOne: {
        filter: {
          runId: params.runId,
          topicId: result.topicId,
        },
        update: {
          $set: {
            runId: params.runId,
            bookId: params.bookId,
            batchId: params.batchId,
            title: result.title,
            detailedSummary: result.detailedSummary,
            keyPoints: result.keyPoints,
            relatedChapters: result.relatedChapters,
            status: result.status,
          },
        },
        upsert: true,
      },
    }))
  );
}

async function runTopicExpansionBatches(params: {
  runId: string;
  sessionId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  validatedRequirement: ValidatedRequirement;
  batches: TopicExpansionInput[];
  concurrency: number;
}) {
  const allResults: TopicExpansionResultItem[] = [];

  for (let index = 0; index < params.batches.length; index += params.concurrency) {
    const slice = params.batches.slice(index, index + params.concurrency);

    const sliceResults = await Promise.all(
      slice.map(async (batch) => {
        let lastError: unknown;

        for (let attempt = 1; attempt <= AGENT_LIMITS.maxRetryPerBatch; attempt += 1) {
          await TopicBatchModel.updateOne(
            { runId: params.runId, batchId: batch.batchId },
            {
              $set: {
                status: "in_progress",
                startedAt: new Date(),
              },
              $inc: {
                attempts: 1,
              },
            }
          );

          try {
            const result = await runTopicExpansionAgent({
              runId: params.runId,
              sessionId: params.sessionId,
              bookId: params.bookId,
              bookTitle: params.bookTitle,
              bookAuthor: params.bookAuthor,
              validatedRequirement: params.validatedRequirement,
              batch,
            });

            await TopicBatchModel.updateOne(
              { runId: params.runId, batchId: batch.batchId },
              {
                $set: {
                  status: "completed",
                  completedAt: new Date(),
                },
              }
            );

            await persistExpansionResults({
              runId: params.runId,
              bookId: params.bookId,
              batchId: batch.batchId,
              results: result.results,
            });

            return result.results;
          } catch (error) {
            lastError = error;
          }
        }

        await TopicBatchModel.updateOne(
          { runId: params.runId, batchId: batch.batchId },
          {
            $set: {
              status: "failed",
              completedAt: new Date(),
            },
          }
        );

        throw lastError;
      })
    );

    allResults.push(...sliceResults.flat());
  }

  return allResults;
}

export async function runSupervisorValidationAgent(input: {
  runId: string;
  sessionId: string;
  userRequest: string;
  candidateRequirement: ValidatedRequirement;
}) {
  return invokeBookifyJsonAgent({
    agentName: AGENT_NAMES.supervisor,
    promptFile: AGENT_PROMPT_FILES.supervisor,
    runId: input.runId,
    sessionId: input.sessionId,
    input,
    schema: validatedRequirementSchema,
  });
}

export async function runBookSummarySupervisor(rawInput: SummarySupervisorInput) {
  const input = summarySupervisorInputSchema.parse(rawInput);

  await connectToDatabase();

  const book = await BookModel.findById(input.bookId)
    .select("title author contextText")
    .lean();

  if (!book) {
    throw new Error(`Book ${input.bookId} not found.`);
  }

  const sessionId = input.sessionId ?? crypto.randomUUID();

  const summaryRun = await SummaryRunModel.create({
    userId: input.userId,
    bookId: input.bookId,
    status: "in_progress",
    userRequest: input.userRequest,
    currentStage: "requirement_discovery",
    loopCount: 0,
    maxLoops: input.maxLoops,
  });

  const runId = summaryRun._id.toString();
  const gapReports: GapIdentifierResult[] = [];
  const expansionMap = new Map<string, TopicExpansionResultItem>();
  let lastSynthesizedTopics: SynthesizedTopic[] = [];

  try {
    const discoveredRequirement = await runRequirementDiscoveryAgent({
      runId,
      sessionId,
      userRequest: input.userRequest,
      bookId: input.bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      existingContext: book.contextText?.slice(0, 8_000),
    });

    await updateSummaryRun(runId, {
      currentStage: "requirement_validation",
    });

    const validatedRequirement = normalizeRequirement(
      await runSupervisorValidationAgent({
        runId,
        sessionId,
        userRequest: input.userRequest,
        candidateRequirement: discoveredRequirement,
      })
    );

    await updateSummaryRun(runId, {
      validatedRequirement,
      currentStage: "coverage_blueprint",
    });

    const coverageBlueprint = await runCoverageBlueprintAgent({
      runId,
      sessionId,
      bookId: input.bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      validatedRequirement,
      contextNotes: book.contextText
        ? [book.contextText.slice(0, 8_000)]
        : [],
    });

    coverageBlueprint.topics = dedupeTopics(coverageBlueprint.topics);
    coverageBlueprint.requiredChapters = [
      ...new Set(coverageBlueprint.requiredChapters),
    ].sort((a, b) => a - b);

    await CoverageBlueprintModel.findOneAndUpdate(
      { runId },
      {
        $set: {
          runId,
          bookId: input.bookId,
          requiredChapters: coverageBlueprint.requiredChapters,
          topics: coverageBlueprint.topics,
          topicCount: coverageBlueprint.topics.length,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    let currentTopics = coverageBlueprint.topics;
    let loopCount = 0;

    while (loopCount < input.maxLoops && currentTopics.length > 0) {
      loopCount += 1;

      await updateSummaryRun(runId, {
        loopCount,
        currentStage: "topic_dispatch",
      });

      const dispatch = await runTopicDispatchAgent({
        runId,
        sessionId,
        topics: currentTopics,
        batchSize: AGENT_LIMITS.topicBatchSize,
      });

      const dispatchBatches = materializeBatchInputs(dispatch.batches);
      await persistTopicBatches({
        runId,
        bookId: input.bookId,
        batches: dispatchBatches,
      });

      await updateSummaryRun(runId, {
        currentStage: "topic_expansion",
      });

      const expandedTopics = await runTopicExpansionBatches({
        runId,
        sessionId,
        bookId: input.bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        validatedRequirement,
        batches: dispatchBatches,
        concurrency: input.topicExpansionConcurrency,
      });

      for (const result of expandedTopics) {
        expansionMap.set(result.topicId, result);
      }

      await updateSummaryRun(runId, {
        currentStage: "topic_synthesis",
      });

      const synthesis = await runTopicSynthesisAgent({
        runId,
        sessionId,
        bookId: input.bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        validatedRequirement,
        expansionResults: [...expansionMap.values()],
      });

      lastSynthesizedTopics = synthesis.synthesizedTopics;

      await TopicSynthesisModel.create({
        runId,
        bookId: input.bookId,
        synthesizedTopics: synthesis.synthesizedTopics,
      });

      await updateSummaryRun(runId, {
        currentStage: "gap_identifier",
      });

      const gapReport = await runGapIdentifierAgent({
        runId,
        sessionId,
        bookId: input.bookId,
        validatedRequirement,
        coverageBlueprint,
        synthesizedTopics: synthesis.synthesizedTopics,
        expansionResults: [...expansionMap.values()],
      });

      gapReports.push(gapReport);

      await GapReportModel.create({
        runId,
        bookId: input.bookId,
        status: gapReport.status,
        missingTopics: gapReport.missingTopics,
        weakTopics: gapReport.weakTopics,
        recommendedAction:
          gapReport.nextAction ?? (gapReport.status === "complete" ? "complete" : "redispatch"),
      });

      if (gapReport.status === "complete") {
        break;
      }

      currentTopics = buildRedispatchTopics({
        gapReport,
        originalTopics: coverageBlueprint.topics,
        expansionMap,
      });
    }

    await updateSummaryRun(runId, {
      currentStage: "summary_packing",
    });

    const finalSummary: FinalSummary = await runSummaryPackingAgent({
      runId,
      sessionId,
      userId: input.userId,
      bookId: input.bookId,
      userRequest: input.userRequest,
      bookTitle: book.title,
      bookAuthor: book.author,
      validatedRequirement,
      coverageBlueprint,
      synthesizedTopics: lastSynthesizedTopics,
      gapReports,
      topicExpansions: [...expansionMap.values()],
      supportingContext: {
        coverageNotes: gapReports
          .filter((report) => report.status === "incomplete")
          .map((report, index) => `Gap loop ${index + 1}: ${report.status}`),
        groundingNotes: [],
        recoveryNotes: gapReports.flatMap((report) =>
          report.missingTopics.map((topic) => `${topic.title}: ${topic.description}`)
        ),
        chapterSummaries: [],
        evidenceBundle: [],
      },
    });

    await updateSummaryRun(runId, {
      status: "completed",
      currentStage: "completed",
    });

    return {
      ...finalSummary,
      runId,
      sessionId,
    };
  } catch (error) {
    await updateSummaryRun(runId, {
      status: "failed",
      currentStage: "failed",
    });

    throw error;
  }
}
