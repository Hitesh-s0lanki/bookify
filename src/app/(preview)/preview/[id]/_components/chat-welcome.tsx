"use client";

import { MessageCircleMore } from "lucide-react";

interface ChatWelcomeProps {
  bookTitle: string;
  onSuggest: (text: string) => void;
}

const SUGGESTIONS = [
  "What is this book about?",
  "Who are the main characters / key figures?",
  "Summarise the first chapter",
];

export function ChatWelcome({ bookTitle, onSuggest }: ChatWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircleMore className="size-6" />
      </div>
      <div>
        <p className="text-sm font-semibold">Ask anything about</p>
        <p className="text-sm font-semibold text-primary">{bookTitle}</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {SUGGESTIONS.map((text) => (
          <button
            key={text}
            onClick={() => onSuggest(text)}
            className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
