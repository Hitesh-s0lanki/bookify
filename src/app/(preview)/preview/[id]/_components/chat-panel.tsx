"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Book } from "@/types/book";

import { ChatWelcome } from "./chat-welcome";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

interface ChatPanelProps {
  book: Book;
  currentPage: number;
  numPages: number | null;
  onPageChange: (page: number) => void;
}

const SESSION_KEY = (bookId: string) => `chat_session_${bookId}`;

export function ChatPanel({ book, numPages, onPageChange }: ChatPanelProps) {
  const sessionIdRef = useRef<string | null>(null);
  const initialisedRef = useRef(false);
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    regenerate,
  } = useChat({
    transport: new DefaultChatTransport({ api: `/api/books/${book.id}/chat` }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // On mount: restore previous session
  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    const storedId = localStorage.getItem(SESSION_KEY(book.id));
    if (!storedId) return;

    sessionIdRef.current = storedId;

    fetch(`/api/books/${book.id}/chat?sessionId=${storedId}`)
      .then((res) => {
        if (res.status === 404 || res.status === 403) {
          localStorage.removeItem(SESSION_KEY(book.id));
          sessionIdRef.current = null;
          return null;
        }
        return res.json();
      })
      .then((data: { messages: UIMessage[] } | null) => {
        if (data?.messages) {
          setMessages(data.messages);
        }
      })
      .catch(() => {
        // silently ignore — start fresh
      });
  }, [book.id, setMessages]);

  // Watch messages to read sessionId annotation and handle go_to_page tool calls
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;

    // Read sessionId from message metadata (written by server as message-metadata chunk)
    if (!sessionIdRef.current && lastMsg.metadata) {
      const meta = lastMsg.metadata as Record<string, unknown>;
      const sid = meta.sessionId as string | undefined;
      if (sid) {
        sessionIdRef.current = sid;
        localStorage.setItem(SESSION_KEY(book.id), sid);
      }
    }

    // Handle go_to_page tool parts
    for (const part of lastMsg.parts ?? []) {
      if (
        part.type.startsWith("tool-") &&
        (part as { toolName?: string }).toolName === "go_to_page" &&
        (part as { state?: string }).state === "input-available"
      ) {
        const raw =
          ((part as { input?: { page?: number } }).input?.page) ?? 1;
        const page = Math.max(1, Math.min(raw, numPages ?? Infinity));
        onPageChange(page);
      }
    }
  }, [messages, book.id, numPages, onPageChange]);

  function handleNewChat() {
    localStorage.removeItem(SESSION_KEY(book.id));
    sessionIdRef.current = null;
    setMessages([]);
    setInput("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    void sendMessage(
      { text },
      { body: { sessionId: sessionIdRef.current ?? undefined } }
    );
  }

  function handleSuggest(text: string) {
    void sendMessage(
      { text },
      { body: { sessionId: sessionIdRef.current ?? undefined } }
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Chat</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={handleNewChat}
        >
          <RotateCcw className="size-3" />
          New chat
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 flex items-center justify-between rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <span>
            {error.message?.includes("book_not_ready")
              ? "This book is still processing. Try again shortly."
              : error.message?.includes("Unauthorized") ||
                  error.message?.includes("401")
                ? "Please sign in to chat."
                : "Something went wrong. Try again."}
          </span>
          {!error.message?.includes("401") &&
            !error.message?.includes("book_not_ready") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => void regenerate()}
              >
                Retry
              </Button>
            )}
        </div>
      )}

      {/* Body */}
      {messages.length === 0 ? (
        <ChatWelcome bookTitle={book.title} onSuggest={handleSuggest} />
      ) : (
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      )}

      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
