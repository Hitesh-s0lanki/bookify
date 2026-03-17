"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type PdfUploadProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string | null;
  disabled?: boolean;
};

export function PdfUpload({ file, onFileChange, error, disabled }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (f: File | null) => {
      if (f && f.type === "application/pdf") {
        onFileChange(f);
      }
    },
    [onFileChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      handleFile(e.dataTransfer.files?.[0] ?? null);
    },
    [handleFile, disabled],
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Book PDF</p>
        <div className="group relative overflow-hidden rounded-xl border-2 border-primary/20 bg-primary/5 p-5 transition-colors hover:border-primary/30">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  onFileChange(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">Book PDF</p>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`
          group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed
          px-6 py-10 text-center transition-all duration-200
          ${isDragOver ? "scale-[1.01] border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
          ${disabled ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <div
          className={`flex size-14 items-center justify-center rounded-full transition-colors ${
            isDragOver ? "bg-primary/15" : "bg-muted group-hover:bg-primary/10"
          }`}
        >
          <Upload
            className={`size-6 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">
            Drop your PDF here or{" "}
            <span className="text-primary underline-offset-4 group-hover:underline">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">PDF up to 50MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          disabled={disabled}
        />
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
