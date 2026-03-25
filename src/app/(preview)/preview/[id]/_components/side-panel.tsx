"use client";

import { Info, MessageCircle, Mic } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Book } from "@/types/book";

import { ChatPanel } from "./chat-panel";
import { VoicePanel } from "./voice-panel";

interface SidePanelProps {
  book: Book;
  currentPage: number;
}

export function SidePanel({ book, currentPage }: SidePanelProps) {
  return (
    <Tabs defaultValue="chat" className="flex h-full flex-col bg-card">
      <div className="flex flex-col gap-3 py-3">
        <div className="flex justify-center">
          <TabsList className="rounded-full">
            <TabsTrigger
              value="summary"
              className="rounded-full py-1 px-4 text-sm"
            >
              <Info className="size-3" />
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-full py-1 px-4 text-sm"
            >
              <MessageCircle className="size-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="rounded-full py-1 px-4 text-sm"
            >
              <Mic className="size-3" />
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
