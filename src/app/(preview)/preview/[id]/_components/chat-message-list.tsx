"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { ChatMessage } from "./chat-message";

interface ChatMessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function ChatMessageList({ messages, isLoading, onPageChange }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessage?.parts]);

  const showTyping =
    isLoading &&
    (!lastMessage || lastMessage.role !== "assistant" || lastMessage.parts.length === 0);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
    >
      <div className="flex flex-col gap-5 px-4 py-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onPageChange={onPageChange}
          />
        ))}

        {/* Typing indicator */}
        {showTyping && (
          <div className="flex items-center gap-1 py-1">
            <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
