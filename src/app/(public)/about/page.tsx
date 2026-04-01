import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Headphones, MessageCircle, Sparkles, Github, Linkedin, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Bookify",
  description: "An AI-powered reading platform — upload any PDF, chat with it, listen to it, and get deep insights.",
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

const techStack = [
  "Next.js", "TypeScript", "React", "Tailwind CSS",
  "MongoDB", "PostgreSQL", "LangChain", "Google Gemini",
  "AWS S3", "Clerk", "Vapi AI", "Inngest",
];

const socials = [
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com/hitesh-s0lanki",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/hitesh-s0lanki",
  },
  {
    icon: Globe,
    label: "Portfolio",
    href: "https://hitesh-solanki.vercel.app",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      {/* Header */}
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          About{" "}
          <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            Bookify
          </span>
        </h1>
        <p className="mx-auto max-w-lg text-muted-foreground">
          An AI-powered reading platform — upload any PDF, chat with it, listen
          to it, and get deep insights. Built by one developer who loves books
          and shipping things.
        </p>
      </header>

      {/* Built By */}
      <section className="rounded-xl border bg-card p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-semibold">Built by</h2>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-500 text-xl font-bold text-white">
            HS
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-lg font-semibold">Hitesh Solanki</p>
              <p className="text-sm text-muted-foreground">
                Software Engineer · Mumbai, India
              </p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              I believe in building meaningful products through clarity,
              ownership, and strong execution. I love breaking down complex
              challenges, designing simple solutions, and using technology as a
              multiplier for business growth.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tech stack</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">What it does</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
