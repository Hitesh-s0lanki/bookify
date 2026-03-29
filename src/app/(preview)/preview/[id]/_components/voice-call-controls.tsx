// src/app/(preview)/preview/[id]/_components/voice-call-controls.tsx
"use client";

import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceCallControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
}

export function VoiceCallControls({ isMuted, onToggleMute, onEndCall }: VoiceCallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button
        variant="outline"
        size="icon"
        className="size-10 rounded-full"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </Button>
      <Button
        variant="destructive"
        size="icon"
        className="size-12 rounded-full"
        onClick={onEndCall}
        aria-label="End call"
      >
        <PhoneOff className="size-5" />
      </Button>
    </div>
  );
}
