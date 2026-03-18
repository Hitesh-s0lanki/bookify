import { Suspense } from "react";

import { SearchResultsContent } from "./search-results-content";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading search results...</p>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
