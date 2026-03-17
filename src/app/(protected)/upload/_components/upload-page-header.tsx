"use client";

import { FileText, Sparkles, Upload, Wand2 } from "lucide-react";

const STEPS = [
  { icon: Upload, label: "Drop files" },
  { icon: Wand2, label: "AI extracts" },
  { icon: FileText, label: "Publish" },
] as const;

/** Borderless header — lives inside the single upload page card */
export function UploadPageHeader() {
  return (
    <header className="px-5 pt-6 sm:px-8 sm:pt-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm dark:bg-background/40">
            <Sparkles className="size-3.5 shrink-0" />
            AI-assisted upload
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              <span className="bg-linear-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent dark:from-foreground dark:via-foreground dark:to-primary">
                Upload Your Book
              </span>
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Drop your PDF and cover — we&apos;ll extract metadata with AI, then
              you publish in one click.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 pt-1 lg:items-end">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && (
                <span
                  className="hidden h-px w-6 bg-linear-to-r from-border to-transparent lg:block"
                  aria-hidden
                />
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm dark:bg-background/30">
                <step.icon className="size-3.5 text-primary" aria-hidden />
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
