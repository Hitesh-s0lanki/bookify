"use server";

import "server-only";

import { createDeepAgent } from "deepagents";

const SIMPLE_AGENT_SYSTEM_PROMPT = `You are Bookify's AI assistant.
Help users with books, reading, summaries, study questions, and writing tasks.
Keep answers clear, helpful, and concise.
When a request is ambiguous, make a reasonable assumption and mention it briefly.`;

// Intentionally simple: no custom tools or external integrations beyond the model.
const simpleBookifyAgent = createDeepAgent({
  model: "openai:gpt-4o-mini",
  systemPrompt: SIMPLE_AGENT_SYSTEM_PROMPT,
});

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }

      return "";
    })
    .join("\n")
    .trim();
}

export async function runSimpleBookifyAgentAction(prompt: string) {
  const normalizedPrompt = prompt.trim();

  if (!normalizedPrompt) {
    throw new Error("Prompt is required.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY for the simple Bookify agent.");
  }

  const result = await simpleBookifyAgent.invoke({
    messages: [{ role: "user", content: normalizedPrompt }],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const output = extractTextFromContent(lastMessage?.content);

  if (!output) {
    throw new Error("The simple Bookify agent did not return a text response.");
  }

  return { output };
}
