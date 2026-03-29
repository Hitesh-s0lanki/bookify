import process from "node:process";

import nextEnv from "@next/env";
import mongoose from "mongoose";

type CliOptions = {
  ids: string[];
  limit?: number;
  force: boolean;
  dryRun: boolean;
};

function printHelp() {
  console.log(`
Backfill Bookify summaries for existing books.

Usage:
  npm run summaries:backfill -- [options]

Options:
  --ids=<id1,id2>     Process only the provided book ids
  --limit=<number>    Process at most this many books
  --force             Re-generate even if a summary already exists
  --dry-run           Show which books would be processed without running
  --help              Show this help message

Examples:
  npm run summaries:backfill
  npm run summaries:backfill -- --limit=10
  npm run summaries:backfill -- --ids=book1,book2 --force
  `.trim());
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    ids: [],
    force: false,
    dryRun: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--ids=")) {
      options.ids = arg
        .slice("--ids=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.slice("--limit=".length), 10);
      if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error(`Invalid --limit value: ${arg}`);
      }
      options.limit = parsed;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function main() {
  const { loadEnvConfig } = nextEnv;
  loadEnvConfig(process.cwd());

  const options = parseArgs(process.argv.slice(2));

  const dbModuleUrl = new URL("../src/lib/db.ts", import.meta.url).href;
  const bookModelModuleUrl = new URL(
    "../src/modules/books/model.ts",
    import.meta.url
  ).href;
  const summaryModuleUrl = new URL(
    "../src/modules/agents/actions/generate-book-summary.ts",
    import.meta.url
  ).href;

  const [{ connectToDatabase }, { BookModel }, { generateBookSummaryForProcessedBook }] =
    await Promise.all([
      import(dbModuleUrl),
      import(bookModelModuleUrl),
      import(summaryModuleUrl),
    ]);

  try {
    await connectToDatabase();

    const filter: Record<string, unknown> = {
      status: { $in: ["READY", "ready"] },
    };

    if (options.ids.length > 0) {
      filter._id = { $in: options.ids };
    } else if (!options.force) {
      filter.$or = [
        { summary: { $exists: false } },
        { summary: null },
        { summary: "" },
      ];
    }

    let query = BookModel.find(filter)
      .sort({ updatedAt: -1 })
      .select("_id title author status summary");

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const books = (await query.lean()) as Array<{
      _id: unknown;
      title: string;
      author: string;
      status: string;
      summary?: string | null;
    }>;

    if (books.length === 0) {
      console.log("No books matched the requested backfill criteria.");
      return;
    }

    console.log(`Found ${books.length} book(s) to process.`);

    if (options.dryRun) {
      for (const book of books) {
        console.log(`- ${String(book._id)} | ${book.title} by ${book.author}`);
      }
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const [index, book] of books.entries()) {
      const bookId = String(book._id);
      console.log(
        `[${index + 1}/${books.length}] Generating summary for "${book.title}" (${bookId})`
      );

      try {
        const result = await generateBookSummaryForProcessedBook({ bookId });

        if (result) {
          successCount += 1;
          console.log(
            `  Success: stored summary for "${book.title}" with run ${result.runId}`
          );
        } else {
          failureCount += 1;
          console.log(`  Failed: summary generation returned no result.`);
        }
      } catch (error) {
        failureCount += 1;
        console.error(`  Failed:`, error);
      }
    }

    console.log("");
    console.log(
      `Backfill complete. Success: ${successCount}, Failed: ${failureCount}`
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Summary backfill failed.", error);
  process.exit(1);
});
