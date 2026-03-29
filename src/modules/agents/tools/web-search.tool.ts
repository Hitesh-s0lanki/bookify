import "server-only";

import { TavilySearch } from "@langchain/tavily";
import { tool } from "langchain";
import { z } from "zod";

export function createWebSearchTool() {
  return tool(
    async ({
      query,
      maxResults,
      topic,
      includeRawContent,
    }: {
      query: string;
      maxResults?: number;
      topic?: "general" | "news";
      includeRawContent?: boolean;
    }) => {
      const apiKey = process.env.TAVILY_API_KEY;

      if (!apiKey) {
        return JSON.stringify(
          {
            unavailable: true,
            reason: "Missing TAVILY_API_KEY",
            query,
          },
          null,
          2
        );
      }

      const search = new TavilySearch({
        maxResults: maxResults ?? 5,
        tavilyApiKey: apiKey,
        includeRawContent: includeRawContent ?? false,
        topic: topic ?? "general",
      });

      const result = await search._call({ query });
      return typeof result === "string" ? result : JSON.stringify(result, null, 2);
    },
    {
      name: "web_search",
      description:
        "Run an external web search when the supervisor or requirement discovery agent needs missing context beyond the book itself.",
      schema: z.object({
        query: z.string().describe("The search query."),
        maxResults: z
          .number()
          .int()
          .positive()
          .max(10)
          .optional()
          .describe("Maximum number of results to fetch."),
        topic: z
          .enum(["general", "news"])
          .optional()
          .describe("Search category."),
        includeRawContent: z
          .boolean()
          .optional()
          .describe("Whether to include raw page content."),
      }),
    }
  );
}
