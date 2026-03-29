"use client";

import { Info, MessageCircle, Mic } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Book } from "@/types/book";

import { ChatPanel } from "./chat-panel";
import { SummaryPanel } from "./summary-panel";
import { VoicePanel } from "./voice-panel";

interface SidePanelProps {
  book: Book;
  currentPage: number;
  numPages: number | null;
  onPageChange: (page: number) => void;
}

export function SidePanel({
  book,
  currentPage,
  numPages,
  onPageChange,
}: SidePanelProps) {
  return (
    <Tabs defaultValue="overview" className="flex h-full flex-col bg-card">
      <div className="flex flex-col gap-3 py-3">
        <div className="flex justify-center">
          <TabsList className="rounded-full">
            <TabsTrigger
              value="overview"
              className="rounded-full px-3 py-1 text-xs sm:px-4 sm:text-sm"
            >
              <Info className="size-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-full px-3 py-1 text-xs sm:px-4 sm:text-sm"
            >
              <MessageCircle className="size-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="rounded-full px-3 py-1 text-xs sm:px-4 sm:text-sm"
            >
              <Mic className="size-3" />
              Voice
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="overview" className="min-h-0 overflow-hidden px-4 sm:px-6">
        <SummaryPanel book={book} />
      </TabsContent>
      <TabsContent value="chat" className="min-h-0 overflow-hidden">
        <ChatPanel
          book={book}
          currentPage={currentPage}
          numPages={numPages}
          onPageChange={onPageChange}
        />
      </TabsContent>
      <TabsContent value="voice" className="overflow-hidden">
        <VoicePanel
          book={book}
          numPages={numPages}
          onPageChange={onPageChange}
        />
      </TabsContent>
    </Tabs>
  );
}
