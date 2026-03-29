// src/app/(preview)/preview/[id]/_components/voice-call-idle.tsx
"use client";

import Image from "next/image";
import { Mic, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Book } from "@/types/book";
import type { VoicePersona } from "@/modules/books/constants";
import { VOICE_PERSONAS } from "@/modules/books/constants";
import type { TranscriptEntry } from "./voice-transcript";
import { VoiceTranscript } from "./voice-transcript";

interface VoiceCallIdleProps {
  book: Book;
  isConnecting: boolean;
  selectedPersona: VoicePersona;
  onPersonaChange: (persona: VoicePersona) => void;
  /** Transcript from the just-ended call — shown read-only, no DB fetch */
  endedTranscript: TranscriptEntry[];
  onStart: () => void;
}

export function VoiceCallIdle({
  book,
  isConnecting,
  selectedPersona,
  onPersonaChange,
  endedTranscript,
  onStart,
}: VoiceCallIdleProps) {
  const hasEndedTranscript = endedTranscript.length > 0;

  return (
    <div className="flex h-full flex-col items-center justify-between px-6 py-6">
      {hasEndedTranscript ? (
        <div className="flex w-full flex-1 flex-col gap-2 overflow-hidden">
          <p className="text-center text-xs font-medium text-muted-foreground">
            Previous conversation
          </p>
          <div className="flex flex-1 flex-col overflow-hidden">
            <VoiceTranscript entries={endedTranscript} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="relative overflow-hidden rounded-2xl border bg-muted/40 p-2">
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                width={140}
                height={200}
                className="rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-[200px] w-[140px] items-center justify-center rounded-xl bg-muted">
                <User className="size-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{book.title}</p>
            <p className="text-xs text-muted-foreground">{book.author}</p>
          </div>

          {/* Voice persona selector */}
          <div className="w-full space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Choose voice</p>
            <div className="grid grid-cols-2 gap-1.5">
              {VOICE_PERSONAS.map((persona) => (
                <button
                  key={persona}
                  onClick={() => onPersonaChange(persona)}
                  disabled={isConnecting}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                    selectedPersona === persona
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {persona}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 w-full">
        <Button
          className="w-full gap-2 rounded-full"
          onClick={onStart}
          disabled={isConnecting}
        >
          <Mic className="size-4" />
          {isConnecting
            ? "Connecting…"
            : hasEndedTranscript
              ? "Start new call"
              : "Start Voice Chat"}
        </Button>
      </div>
    </div>
  );
}
