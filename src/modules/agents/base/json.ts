import "server-only";

import { ZodType } from "zod";

function extractBalancedJsonSlice(text: string) {
  const openingIndex = text.search(/[\[{]/);

  if (openingIndex === -1) {
    return null;
  }

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = openingIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{" || char === "[") {
      stack.push(char);
      continue;
    }

    if (char === "}" || char === "]") {
      const last = stack[stack.length - 1];

      if (
        (char === "}" && last === "{") ||
        (char === "]" && last === "[")
      ) {
        stack.pop();

        if (stack.length === 0) {
          return text.slice(openingIndex, index + 1);
        }
      }
    }
  }

  return null;
}

export function extractJsonFromText(text: string) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? text.trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const balancedJson = extractBalancedJsonSlice(candidate);

    if (balancedJson) {
      return JSON.parse(balancedJson);
    }

    throw new Error("Agent response did not contain valid JSON.");
  }
}

export function parseAgentJson<T>(text: string, schema: ZodType<T>) {
  return schema.parse(extractJsonFromText(text));
}
