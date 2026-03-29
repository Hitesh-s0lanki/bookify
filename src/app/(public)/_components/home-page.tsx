import { BookOpen } from "lucide-react";

import { HeroSection } from "./hero-section";
import { LibraryContent } from "./library-content";
import { ContinueReadingSection } from "./continue-reading-section";

export function HomePage() {
  return (
    <div className="space-y-6">
      <HeroSection />

      <ContinueReadingSection />

      <section className="pb-20">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
            <BookOpen className="size-3.5 text-primary" />
          </div>
          <h2 className="text-base font-bold tracking-tight">Recent Books</h2>
        </div>
        <LibraryContent limit={10} />
      </section>
    </div>
  );
}
