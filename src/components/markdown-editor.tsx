"use client";

import ReactMarkdown from "react-markdown";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** CSS length value, e.g. "12rem" or "200px". Default: "12rem" */
  height?: string;
  /** Forwarded to the internal <textarea> */
  maxLength?: number;
  /** Forwarded to the internal <textarea> for <Label htmlFor> association */
  id?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write a description…",
  disabled = false,
  height = "12rem",
  maxLength,
  id,
}: MarkdownEditorProps) {
  return (
    <div
      className="overflow-hidden rounded-md border border-input"
      style={{ height }}
    >
      <Tabs defaultValue="code" className="gap-0 h-full">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-input bg-muted/30 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Description</span>
          <TabsList variant="line" className="h-auto gap-0 bg-transparent p-0">
            <TabsTrigger value="code" className="text-xs px-2 py-0.5">
              Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-2 py-0.5">
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Code tab */}
        <TabsContent value="code" className="h-full mt-0">
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              "h-full w-full resize-none bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground outline-none",
              "overflow-y-auto",
              disabled && "cursor-not-allowed opacity-50"
            )}
          />
        </TabsContent>

        {/* Preview tab */}
        <TabsContent value="preview" className="h-full mt-0 overflow-y-auto">
          {value.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 text-sm">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {placeholder}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
