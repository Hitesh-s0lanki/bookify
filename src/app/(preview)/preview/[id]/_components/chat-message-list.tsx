"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { ChatMessage } from "./chat-message";

interface ChatMessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function ChatMessageList({ messages, isLoading, onPageChange }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lastMessage?.parts]);

  // Show skeleton when loading and last message has no content yet
  const showSkeleton =
    isLoading &&
    (!lastMessage || lastMessage.role !== "assistant" || lastMessage.parts.length === 0);

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4 px-4 py-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onPageChange={onPageChange}
          />
        ))}
        {showSkeleton && (
          <div className="flex justify-start">
            <div className="w-48 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
