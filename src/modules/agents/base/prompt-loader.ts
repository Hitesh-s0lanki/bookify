import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const promptCache = new Map<string, string>();

export async function loadAgentPrompt(fileName: string) {
  const existing = promptCache.get(fileName);
  if (existing) {
    return existing;
  }

  const promptPath = path.join(process.cwd(), "src", "prompts", "agents", fileName);
  const prompt = await readFile(promptPath, "utf8");
  promptCache.set(fileName, prompt);
  return prompt;
}
