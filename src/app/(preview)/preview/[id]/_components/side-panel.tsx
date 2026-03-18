"use client";

import Image from "next/image";
import { BookOpen, MessageCircle, Mic, Tag, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Book } from "@/types/book";

import { ChatPanel } from "./chat-panel";
import { VoicePanel } from "./voice-panel";

interface SidePanelProps {
  book: Book;
  currentPage: number;
}

function BookInfoCard({ book }: { book: Book }) {
  return (
    <div className="mx-3 flex gap-3 rounded-lg border bg-muted/30 p-3">
      {book.coverUrl && (
        <Image
          src={book.coverUrl}
          alt={book.title}
          width={48}
          height={64}
          className="shrink-0 rounded-md object-cover"
        />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold leading-tight">
          {book.title}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="size-3 shrink-0" />
          <span className="truncate">{book.author}</span>
        </p>
        {book.genre && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="size-3 shrink-0" />
            <span className="truncate">{book.genre}</span>
          </p>
        )}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <Tag className="size-3 shrink-0 text-muted-foreground" />
            {book.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-[10px]"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SidePanel({ book, currentPage }: SidePanelProps) {
  return (
    <Tabs defaultValue="chat" className="flex h-full flex-col bg-card">
      <div className="flex flex-col gap-3 py-3">
        <BookInfoCard book={book} />
        <div className="flex justify-center">
          <TabsList className="rounded-full">
            <TabsTrigger value="chat" className="rounded-full">
              <MessageCircle className="size-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="voice" className="rounded-full">
              <Mic className="size-3.5" />
              Voice
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="chat" className="overflow-hidden">
        <ChatPanel book={book} currentPage={currentPage} />
      </TabsContent>
      <TabsContent value="voice" className="overflow-hidden">
        <VoicePanel book={book} />
      </TabsContent>
    </Tabs>
  );
}
