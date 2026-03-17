import { HeroSection } from "./hero-section";
import { LibraryContent } from "./library-content";

/** Composes hero + library; keeps page.tsx as a one-liner entry. */
export function HomePage() {
  return (
    <div className="space-y-10">
      <HeroSection />
      <section>
        <LibraryContent />
      </section>
    </div>
  );
}
