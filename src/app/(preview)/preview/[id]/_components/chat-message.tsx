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
    const textContent = (message.parts ?? [])
      .filter((p) => p.type === "text")
      .map((p) => (p as TextPart).text)
      .join("");

    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-sm">
          {textContent}
        </div>
      </div>
    );
  }

  const reasoningPart = message.parts?.find((p) => p.type === "reasoning") as ReasoningPart | undefined;

  const textContent = (message.parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => (p as TextPart).text)
    .join("");

  const toolParts = (message.parts ?? []).filter((p) => p.type.startsWith("tool-")) as ToolPart[];

  return (
    <div className="flex items-start">
      <div className="min-w-0 flex-1 space-y-1.5">
        {reasoningPart?.text && (
          <ReasoningBlock reasoning={reasoningPart.text} />
        )}

        {textContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <Markdown>{textContent}</Markdown>
          </div>
        )}

        {toolParts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
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
