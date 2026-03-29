"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ReasoningBlockProps {
  reasoning: string;
}

export function ReasoningBlock({ reasoning }: ReasoningBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-2">
      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
        <ChevronRight
          className={`size-3 transition-transform ${open ? "rotate-90" : ""}`}
        />
        Thinking…
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
          {reasoning}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
