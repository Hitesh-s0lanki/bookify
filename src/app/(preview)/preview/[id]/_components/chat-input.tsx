"use client";

import { useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  hasMessages: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onNewChat: () => void;
}

export function ChatInput({
  input,
  isLoading,
  hasMessages,
  onInputChange,
  onSubmit,
  onNewChat,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        e.currentTarget.form?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
    }
  }

  const canSubmit = !isLoading && !!input.trim();

  return (
    <div className="px-8 pb-3 pt-2">
      <form onSubmit={onSubmit}>
        {/* Floating textarea container */}
        <div className="relative flex items-end rounded-2xl border border-border/50 bg-muted/10 shadow-sm transition-colors focus-within:border-border focus-within:bg-background focus-within:shadow-md">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this book…"
            rows={3}
            disabled={isLoading}
            className="min-h-[44px] w-full resize-none bg-muted/20 px-4 py-3 pr-12 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "140px", overflowY: "auto" }}
          />
          <div className="absolute bottom-1.5 right-1.5 shrink-0">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ArrowUp className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Hint row */}
        <div className="mt-1.5 flex items-center justify-center gap-2 px-1">
          <span className="text-[12px] text-muted-foreground/50">
            Enter to send · Shift+Enter for new line
          </span>
          {hasMessages && (
            <button
              type="button"
              onClick={onNewChat}
              className="text-[12px] text-muted-foreground/50 underline underline-offset-2 hover:text-muted-foreground hover:underline transition-colors cursor-pointer"
            >
              Start a New chat
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
