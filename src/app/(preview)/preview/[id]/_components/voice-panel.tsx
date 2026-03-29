// src/app/(preview)/preview/[id]/_components/voice-panel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";

import type { Book } from "@/types/book";
import type { TranscriptEntry } from "./voice-transcript";
import { VoiceCallIdle } from "./voice-call-idle";
import { VoiceCallControls } from "./voice-call-controls";
import { VoiceWaveform } from "./voice-waveform";
import { VoiceTranscript } from "./voice-transcript";

type CallState = "idle" | "connecting" | "active" | "ended";

interface VoicePanelProps {
  book: Book;
  numPages: number | null;
  onPageChange: (page: number) => void;
}

const GO_TO_PAGE_TOOL = {
  type: "function" as const,
  function: {
    name: "go_to_page",
    description: "Navigate the PDF viewer to a specific page number",
    parameters: {
      type: "object" as const,
      properties: {
        page: { type: "number" as const, description: "1-based page number to navigate to" },
      },
      required: ["page"],
    },
  },
};

export function VoicePanel({ book, numPages, onPageChange }: VoicePanelProps) {
  const vapiRef = useRef<Vapi | null>(null);
  // Refs keep event handlers free of stale closures
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const numPagesRef = useRef(numPages);
  const onPageChangeRef = useRef(onPageChange);
  const bookIdRef = useRef(book.id);

  useEffect(() => { numPagesRef.current = numPages; }, [numPages]);
  useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);

  const [callState, setCallState] = useState<CallState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [endedTranscript, setEndedTranscript] = useState<TranscriptEntry[]>([]);

  // Initialise Vapi once on mount
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => setCallState("active"));

    vapi.on("call-end", () => {
      setCallState("ended");
      setVolume(0);

      const saved = transcriptRef.current.slice();
      transcriptRef.current = [];
      setTranscript([]);

      if (saved.length > 0) {
        setEndedTranscript(saved);

        fetch(`/api/books/${bookIdRef.current}/voice-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: saved.map((e) => ({
              role: e.role,
              text: e.text,
              timestamp: e.timestamp.toISOString(),
            })),
          }),
        }).catch((err) => {
          console.error("Failed to save voice transcript", err);
        });
      }
    });

    vapi.on("volume-level", (level: number) => setVolume(level));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on("message", (message: any) => {
      if (
        message?.type === "transcript" &&
        message?.transcriptType === "final" &&
        typeof message?.transcript === "string" &&
        (message?.role === "user" || message?.role === "assistant")
      ) {
        const entry: TranscriptEntry = {
          role: message.role as "user" | "assistant",
          text: message.transcript as string,
          timestamp: new Date(),
        };
        transcriptRef.current = [...transcriptRef.current, entry];
        setTranscript((prev) => [...prev, entry]);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vapi as any).on("function-call", (payload: any) => {
      const fc = payload?.functionCall ?? payload;
      if (fc?.name === "go_to_page" && typeof fc?.parameters?.page === "number") {
        const page = Math.max(1, Math.min(fc.parameters.page, numPagesRef.current ?? Infinity));
        onPageChangeRef.current(page);
      }
    });

    vapi.on("error", (error: Error) => {
      console.error("Vapi error", error);
      const msg = (error?.message ?? "").toLowerCase();
      if (msg.includes("permission") || msg.includes("microphone")) {
        toast.error("Microphone access required to use voice chat.");
      } else {
        toast.error("Voice chat error. Please try again.");
      }
      setCallState("idle");
      setVolume(0);
    });

    return () => {
      vapi.stop();
    };
  }, []);  

  function handleStart() {
    if (!vapiRef.current || !book.vapiAssistantId) return;
    setCallState("connecting");
    setTranscript([]);
    transcriptRef.current = [];
    setIsMuted(false);
    setVolume(0);
    setEndedTranscript([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vapiRef.current as any).start(book.vapiAssistantId, {
      assistantOverrides: { model: { tools: [GO_TO_PAGE_TOOL] } },
    });
  }

  function handleEndCall() {
    vapiRef.current?.stop();
  }

  function handleToggleMute() {
    if (!vapiRef.current) return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  }

  const isActive = callState === "active";
  const showIdle = callState === "idle" || callState === "ended" || callState === "connecting";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Voice</span>
        {isActive && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            Live
          </span>
        )}
      </div>

      {/* Body */}
      {showIdle ? (
        <VoiceCallIdle
          book={book}
          isConnecting={callState === "connecting"}
          endedTranscript={endedTranscript}
          onStart={handleStart}
        />
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-col items-center pt-4 pb-2">
            <VoiceWaveform volume={volume} isActive={isActive} />
          </div>
          <VoiceTranscript entries={transcript} />
          <VoiceCallControls
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onEndCall={handleEndCall}
          />
        </div>
      )}
    </div>
  );
}
