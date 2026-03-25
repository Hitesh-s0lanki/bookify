"use client";

import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  /** Label shown in the component header. Pass undefined to hide it. Default: "Description" */
  label?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write a description…",
  disabled = false,
  height = "32rem",
  maxLength,
  id,
  label = "Description",
}: MarkdownEditorProps) {
  return (
    <div
      className="overflow-hidden rounded-md border border-input relative "
      style={{ height }}
    >
      <Tabs defaultValue="code" className="gap-0 h-full px-2 py-5">
        {/* Header bar */}
        <div className="flex items-center justify-end absolute right-4 top-4 gap-2">
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          <TabsList className="rounded-full max-h-8">
            <TabsTrigger
              value="code"
              className="text-xs px-2 py-1 h-5 rounded-full"
            >
              Code
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="text-xs px-2 py-1 h-5 rounded-full"
            >
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Code tab */}
        <TabsContent
          value="code"
          className="h-full mt-0 min-h-0 overflow-hidden"
        >
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
              disabled && "cursor-not-allowed opacity-50",
            )}
          />
        </TabsContent>

        {/* Preview tab */}
        <TabsContent
          value="preview"
          className="h-full mt-0 min-h-0 overflow-y-auto"
        >
          {value.trim() ? (
            <div className="prose prose-sm dark:prose-invert max-w-3xl px-5 py-3">
              <ReactMarkdown
                components={{
                  h1: ({ node: _node, ...props }) => (
                    <h1
                      className="text-2xl font-bold mt-4 mb-2 leading-tight"
                      {...props}
                    />
                  ),
                  h2: ({ node: _node, ...props }) => (
                    <h2
                      className="text-xl font-semibold mt-3 mb-1.5 leading-snug"
                      {...props}
                    />
                  ),
                  h3: ({ node: _node, ...props }) => (
                    <h3
                      className="text-lg font-semibold mt-3 mb-1"
                      {...props}
                    />
                  ),
                  h4: ({ node: _node, ...props }) => (
                    <h4
                      className="text-base font-semibold mt-2 mb-1"
                      {...props}
                    />
                  ),
                  h5: ({ node: _node, ...props }) => (
                    <h5
                      className="text-sm font-semibold mt-2 mb-0.5"
                      {...props}
                    />
                  ),
                  h6: ({ node: _node, ...props }) => (
                    <h6
                      className="text-sm font-medium mt-2 mb-0.5 text-muted-foreground"
                      {...props}
                    />
                  ),
                }}
              >
                {value}
              </ReactMarkdown>
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
