"use client";

import type { UIMessage } from "ai";
import Markdown from "react-markdown";

import { ReasoningBlock } from "./reasoning-block";
import { GoToPageToolCall } from "./go-to-page-tool-call";

interface ChatMessageProps {
  message: UIMessage;
  onPageChange: (page: number) => void;
}

type TextPart = { type: "text"; text: string };
type ReasoningPart = { type: "reasoning"; text: string; state?: "streaming" | "done" };
type ToolPart = {
  type: string;
  toolCallId: string;
  toolName: string;
  input: unknown;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
};

export function ChatMessage({ message, onPageChange }: ChatMessageProps) {
  if (message.role === "user") {
    // Extract text content from text parts
    const textContent = (message.parts ?? [])
      .filter((p) => p.type === "text")
      .map((p) => (p as TextPart).text)
      .join("");

    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-muted px-3 py-2 text-sm">
          {textContent}
        </div>
      </div>
    );
  }

  // Find reasoning part
  const reasoningPart = message.parts?.find((p) => p.type === "reasoning") as ReasoningPart | undefined;

  // Extract text content from text parts
  const textContent = (message.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => (p as TextPart).text)
    .join("");

  // Find tool parts (go_to_page)
  const toolParts = (message.parts ?? []).filter((p) => p.type.startsWith("tool-")) as ToolPart[];

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-1">
        {reasoningPart?.text && (
          <ReasoningBlock reasoning={reasoningPart.text} />
        )}

        <div className="prose prose-sm dark:prose-invert text-sm">
          <Markdown>{textContent}</Markdown>
        </div>

        {toolParts.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {toolParts.map((part) => {
              if (part.toolName === "go_to_page") {
                const page = (part.input as { page: number }).page;
                return (
                  <GoToPageToolCall
                    key={part.toolCallId}
                    page={page}
                    state={part.state}
                    onPageChange={onPageChange}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
