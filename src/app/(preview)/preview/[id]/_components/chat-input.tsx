"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        e.currentTarget.form?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
      <Textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about this book…"
        rows={1}
        className="resize-none overflow-y-auto max-h-[120px] flex-1 text-sm"
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="icon"
        className="size-9 shrink-0"
        disabled={isLoading || !input.trim()}
      >
        <ArrowUp className="size-4" />
      </Button>
    </form>
  );
}
