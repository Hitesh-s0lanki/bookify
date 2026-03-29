// src/app/(preview)/preview/[id]/_components/voice-waveform.tsx
"use client";

interface VoiceWaveformProps {
  /** Current volume level from Vapi (0–1). 0 means idle/thinking. */
  volume: number;
  /** True when call-start has fired */
  isActive: boolean;
}

// Multipliers per bar — tallest in the middle, shorter toward edges
const MULTIPLIERS = [0.25, 0.45, 0.65, 0.85, 1.0, 0.85, 0.65, 0.45, 0.25];

export function VoiceWaveform({ volume, isActive }: VoiceWaveformProps) {
  return (
    <div className="flex h-16 items-center justify-center gap-1.5">
      {MULTIPLIERS.map((mult, i) => {
        const heightPercent =
          isActive && volume > 0
            ? Math.max(10, Math.min(100, volume * mult * 100))
            : 10;

        return (
          <div
            key={i}
            className={`w-1.5 rounded-full bg-primary transition-all duration-75 ${
              isActive && volume === 0 ? "animate-pulse opacity-60" : ""
            }`}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
}
