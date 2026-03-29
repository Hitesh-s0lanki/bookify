// src/app/(preview)/preview/[id]/_components/voice-call-controls.tsx
"use client";

import { Mic, MicOff, Square } from "lucide-react";

interface VoiceCallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
}

export function VoiceCallControls({ isMuted, onToggleMute, onEndCall }: VoiceCallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-3 sm:py-5">
      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        className={`group relative flex size-11 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 ${
          isMuted
            ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
            : "border-border bg-muted/60 text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
        }`}
      >
        {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </button>

      {/* Stop button */}
      <button
        onClick={onEndCall}
        aria-label="Stop voice chat"
        className="group relative flex cursor-pointer flex-col items-center gap-1"
      >
        {/* Hover ring */}
        <span className="absolute inline-flex size-16 rounded-full bg-destructive/10 transition-all duration-300 group-hover:size-20 group-hover:bg-destructive/15" />
        <span className="relative flex size-14 items-center justify-center rounded-full bg-destructive shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-destructive/30 group-hover:shadow-xl">
          <Square className="size-5 fill-destructive-foreground text-destructive-foreground" />
        </span>
      </button>
    </div>
  );
}
