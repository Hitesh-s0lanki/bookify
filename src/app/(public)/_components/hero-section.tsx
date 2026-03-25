import {
  BookOpen,
  Sparkles,
  MessageCircle,
  Headphones,
  Brain,
  BookMarked,
  Zap,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 px-4 py-5 dark:from-primary/20 dark:via-primary/15 dark:to-primary/10 sm:rounded-2xl sm:px-10 sm:py-10">
      {/* Decorative background orbs */}
      <div className="animate-pulse-soft absolute -right-12 -top-12 size-48 rounded-full bg-primary/20 blur-3xl dark:bg-primary/15" />
      <div className="animate-pulse-soft absolute -bottom-8 -left-8 size-36 rounded-full bg-primary/15 blur-3xl delay-2 dark:bg-primary/10" />
      <div className="animate-pulse-soft absolute left-1/2 top-0 hidden size-28 rounded-full bg-primary/10 blur-3xl delay-4 sm:block dark:bg-primary/10" />

      {/* Decorative dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Floating icons — hidden on mobile */}
      <FloatingIcon
        icon={BookOpen}
        className="right-[22%] top-[34%] delay-0"
        variant="default"
      />
      <FloatingIcon
        icon={Headphones}
        className="right-[10%] top-[20%] delay-1"
        variant="dim"
      />
      <FloatingIcon
        icon={MessageCircle}
        className="right-[10%] top-[52%] delay-2"
        variant="soft"
      />
      <FloatingIcon
        icon={BookMarked}
        className="right-[34%] top-[52%] delay-4"
        variant="dim"
        size="sm"
      />
      <FloatingIcon
        icon={Sparkles}
        className="right-[34%] top-[20%] delay-5"
        variant="soft"
        size="sm"
      />

      {/* Text content */}
      <div className="relative z-10 max-w-lg space-y-2 sm:space-y-3">
        <div className="animate-fade-in inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-primary backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1 sm:text-xs dark:border-primary/40 dark:bg-primary/10">
          <Sparkles className="size-3" />
          AI-Powered Reading
        </div>

        <h1 className="animate-fade-in-up text-2xl font-extrabold tracking-tight sm:text-4xl">
          Read Smarter with{" "}
          <span className="text-primary">Bookify</span>
        </h1>

        <p className="animate-fade-in-up max-w-md text-xs leading-relaxed text-muted-foreground delay-1 sm:text-base">
          Upload any book, chat with it, and listen to voice summaries — all
          powered by AI.
        </p>
      </div>

      {/* Bottom feature bar */}
      <div className="animate-fade-in relative z-10 mt-4 flex items-center justify-around gap-2 rounded-lg border border-primary/20 bg-white/40 px-3 py-2 backdrop-blur-sm delay-3 sm:mt-6 sm:justify-between sm:gap-0 sm:rounded-xl sm:px-5 sm:py-3 dark:border-primary/15 dark:bg-white/5">
        <StatItem icon={Zap} value="Instant" label="AI Responses" />
        <div className="hidden h-8 w-px bg-primary/20 sm:block dark:bg-primary/20" />
        <StatItem icon={BookOpen} value="PDF" label="Support" />
        <div className="hidden h-8 w-px bg-primary/20 sm:block dark:bg-primary/20" />
        <StatItem
          icon={Headphones}
          value="Voice"
          label="Conversations"
          className="hidden sm:flex"
        />
        <div className="hidden h-8 w-px bg-primary/20 sm:block dark:bg-primary/20" />
        <StatItem
          icon={Brain}
          value="Smart"
          label="Summaries"
          className="hidden sm:flex"
        />
      </div>
    </section>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <Icon className="size-3.5 text-primary sm:size-4" />
      <div>
        <p className="text-xs font-bold leading-none sm:text-sm">{value}</p>
        <p className="text-[10px] text-muted-foreground sm:text-[11px]">
          {label}
        </p>
      </div>
    </div>
  );
}

function FloatingIcon({
  icon: Icon,
  className = "",
  variant = "default",
  size = "md",
}: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  variant?: "default" | "dim" | "soft";
  size?: "sm" | "md";
}) {
  const variants = {
    default:
      "border-primary/30 bg-primary/10 text-primary dark:border-primary/25 dark:bg-primary/15",
    dim: "border-primary/20 bg-primary/5 text-primary/70 dark:border-primary/20 dark:bg-primary/10 dark:text-primary/80",
    soft: "border-primary/40 bg-primary/15 text-primary dark:border-primary/30 dark:bg-primary/20",
  };

  const sizeClasses = size === "sm" ? "p-2 rounded-lg" : "p-2.5 rounded-xl";
  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <div
      className={`animate-float absolute hidden border shadow-md backdrop-blur-sm sm:block ${sizeClasses} ${variants[variant]} ${className}`}
    >
      <Icon className={iconSize} />
    </div>
  );
}
