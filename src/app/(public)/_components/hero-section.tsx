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
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-6 py-8 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-rose-950/40 sm:px-10 sm:py-10">
      {/* Decorative background orbs */}
      <div className="animate-pulse-soft absolute -right-12 -top-12 size-48 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-700/15" />
      <div className="animate-pulse-soft absolute -bottom-8 -left-8 size-36 rounded-full bg-orange-200/30 blur-3xl delay-2 dark:bg-orange-700/15" />
      <div className="animate-pulse-soft absolute left-1/2 top-0 size-28 rounded-full bg-rose-200/20 blur-3xl delay-4 dark:bg-rose-700/10" />

      {/* Decorative dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Floating icons scattered around */}
      <FloatingIcon
        icon={BookOpen}
        className="left-[60%] top-[10%] delay-0"
        color="amber"
      />
      <FloatingIcon
        icon={Headphones}
        className="right-[8%] top-[25%] delay-1"
        color="orange"
      />
      <FloatingIcon
        icon={MessageCircle}
        className="right-[18%] bottom-[12%] delay-2"
        color="rose"
      />
      <FloatingIcon
        icon={Brain}
        className="left-[55%] bottom-[15%] delay-3"
        color="purple"
      />
      <FloatingIcon
        icon={BookMarked}
        className="right-[35%] top-[8%] delay-4"
        color="amber"
        size="sm"
      />
      <FloatingIcon
        icon={Sparkles}
        className="right-[28%] bottom-[40%] delay-5"
        color="orange"
        size="sm"
      />

      {/* Left-aligned text content */}
      <div className="relative z-10 max-w-lg space-y-3">
        <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-white/60 px-3 py-1 text-xs font-medium text-amber-700 backdrop-blur-sm dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
          <Sparkles className="size-3" />
          AI-Powered Reading
        </div>

        <h1 className="animate-fade-in-up text-3xl font-extrabold tracking-tight sm:text-4xl">
          Read Smarter with{" "}
          <span className="animate-gradient-x bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
            Bookify
          </span>
        </h1>

        <p className="animate-fade-in-up max-w-md text-sm leading-relaxed text-muted-foreground delay-1 sm:text-base">
          Upload any book, chat with it, and listen to voice summaries — all
          powered by AI.
        </p>
      </div>

      {/* Bottom feature bar */}
      <div className="animate-fade-in relative z-10 mt-6 flex items-center justify-between rounded-xl border border-amber-100/60 bg-white/40 px-5 py-3 backdrop-blur-sm delay-3 dark:border-amber-900/20 dark:bg-white/5">
        <StatItem icon={Zap} value="Instant" label="AI Responses" />
        <div className="h-8 w-px bg-amber-200/40 dark:bg-amber-800/30" />
        <StatItem icon={BookOpen} value="PDF" label="Support" />
        <div className="h-8 w-px bg-amber-200/40 dark:bg-amber-800/30" />
        <StatItem icon={Headphones} value="Voice" label="Conversations" />
        <div className="hidden h-8 w-px bg-amber-200/40 dark:bg-amber-800/30 sm:block" />
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
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon className="size-4 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="text-sm font-bold leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function FloatingIcon({
  icon: Icon,
  className = "",
  color,
  size = "md",
}: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  color: "amber" | "orange" | "rose" | "purple";
  size?: "sm" | "md";
}) {
  const colors = {
    amber:
      "border-amber-200/40 bg-amber-50/70 text-amber-500 dark:border-amber-800/30 dark:bg-amber-950/40 dark:text-amber-400",
    orange:
      "border-orange-200/40 bg-orange-50/70 text-orange-500 dark:border-orange-800/30 dark:bg-orange-950/40 dark:text-orange-400",
    rose: "border-rose-200/40 bg-rose-50/70 text-rose-500 dark:border-rose-800/30 dark:bg-rose-950/40 dark:text-rose-400",
    purple:
      "border-purple-200/40 bg-purple-50/70 text-purple-500 dark:border-purple-800/30 dark:bg-purple-950/40 dark:text-purple-400",
  };

  const sizeClasses = size === "sm" ? "p-2 rounded-lg" : "p-2.5 rounded-xl";
  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <div
      className={`animate-float absolute hidden border shadow-md backdrop-blur-sm sm:block ${sizeClasses} ${colors[color]} ${className}`}
    >
      <Icon className={iconSize} />
    </div>
  );
}
