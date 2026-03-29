import type { Metadata } from "next";
import { Library } from "lucide-react";

import { LibraryInfiniteContent } from "./_components/library-infinite-content";

export const metadata: Metadata = {
  title: "Library — Bookify",
  description: "Browse your full AI-powered reading library.",
};

export default function LibraryPage() {
  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
          <Library className="size-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Library</h1>
          <p className="text-xs text-muted-foreground">All your books, scroll to load more</p>
        </div>
      </div>

      <LibraryInfiniteContent />
    </div>
  );
}
