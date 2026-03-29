"use client";

import Image from "next/image";
import { Mic } from "lucide-react";

import type { Book } from "@/types/book";

interface VoicePanelProps {
  book: Book;
}

export function VoicePanel({ book }: VoicePanelProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <div className="relative w-full max-w-xs  p-2">
        <Image
          src="/voice.gif"
          alt="Voice interface preview"
          width={420}
          height={420}
          className="h-auto w-full rounded-xl"
          priority
          unoptimized
        />
      </div>
      <div className="mt-5 flex items-center gap-2 text-primary">
        <Mic className="size-4" />
        <p className="text-sm font-semibold">Voice coming soon</p>
      </div>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Voice interface for &quot;{book.title}&quot; is under development.
      </p>
    </div>
  );
}
