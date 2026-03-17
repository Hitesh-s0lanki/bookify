import type { Metadata } from "next";
import { BookOpen, Headphones, MessageCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Bookify",
};

const features = [
  {
    icon: BookOpen,
    title: "Smart Reading",
    description: "Upload any PDF and read it with a clean, distraction-free interface.",
  },
  {
    icon: MessageCircle,
    title: "Chat with Books",
    description: "Ask questions about any book and get accurate, AI-powered answers instantly.",
  },
  {
    icon: Headphones,
    title: "Voice Conversations",
    description: "Listen to summaries and have spoken conversations with your books.",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    description: "Get key takeaways, chapter summaries, and deep analysis automatically.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          About{" "}
          <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            Bookify
          </span>
        </h1>
        <p className="mx-auto max-w-lg text-muted-foreground">
          Bookify is an AI-powered reading platform that transforms how you
          interact with books. Upload, read, chat, and listen — all in one
          place.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="text-center text-sm text-muted-foreground">
        <p>
          Built with Next.js, AI, and a love for reading.
        </p>
      </section>
    </div>
  );
}
