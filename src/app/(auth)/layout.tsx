import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left panel — decorative book-themed side */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 lg:flex lg:flex-col lg:justify-between">
        {/* Floating book shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-float absolute left-[10%] top-[12%] h-44 w-32 rotate-[-8deg] rounded-sm bg-white/10 shadow-lg backdrop-blur-sm" />
          <div className="animate-float absolute right-[15%] top-[22%] h-52 w-36 rotate-[5deg] rounded-sm bg-white/[0.07] shadow-lg backdrop-blur-sm delay-2" />
          <div className="animate-float absolute bottom-[18%] left-[20%] h-48 w-34 rotate-[12deg] rounded-sm bg-white/[0.08] shadow-lg backdrop-blur-sm delay-4" />
          <div className="animate-float absolute bottom-[30%] right-[10%] h-40 w-28 rotate-[-5deg] rounded-sm bg-white/[0.06] shadow-lg backdrop-blur-sm delay-6" />

          {/* Spine lines on the books */}
          <div className="absolute left-[10%] top-[12%] ml-3 h-44 w-px rotate-[-8deg] bg-white/20" />
          <div className="absolute right-[15%] top-[22%] ml-3 h-52 w-px rotate-[5deg] bg-white/15" />
          <div className="absolute bottom-[18%] left-[20%] ml-3 h-48 w-px rotate-[12deg] bg-white/15" />

          {/* Decorative dots / stars */}
          <div className="animate-pulse-soft absolute left-[50%] top-[8%] size-2 rounded-full bg-amber-200/60" />
          <div className="animate-pulse-soft absolute left-[70%] top-[45%] size-1.5 rounded-full bg-orange-200/50 delay-3" />
          <div className="animate-pulse-soft absolute left-[30%] top-[65%] size-2 rounded-full bg-rose-200/40 delay-5" />
          <div className="animate-pulse-soft absolute left-[80%] top-[75%] size-1.5 rounded-full bg-amber-200/50 delay-1" />

          {/* Large blurred orbs */}
          <div className="absolute -left-20 -top-20 size-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 size-72 rounded-full bg-rose-400/20 blur-3xl" />
        </div>

        {/* Top — Logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2.5 text-white transition-opacity hover:opacity-80">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <BookOpen className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Bookify</span>
          </Link>
        </div>

        {/* Center — Quote */}
        <div className="relative z-10 px-10">
          <blockquote className="max-w-md space-y-4">
            <div className="flex gap-1 text-amber-200/60">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="size-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-lg font-medium leading-relaxed text-white/90">
              &ldquo;A reader lives a thousand lives before he dies. The man who never reads lives only one.&rdquo;
            </p>
            <footer className="text-sm text-white/50">
              &mdash; George R.R. Martin
            </footer>
          </blockquote>
        </div>

        {/* Bottom — Feature chips */}
        <div className="relative z-10 p-10">
          <div className="flex flex-wrap gap-2">
            {["AI Voice Conversations", "Smart Library", "PDF Processing"].map(
              (feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-sm"
                >
                  {feature}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-col">
        {/* Mobile logo */}
        <div className="p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-70">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <BookOpen className="size-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Bookify</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="animate-fade-in-up w-full max-w-sm">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to Bookify&apos;s{" "}
          <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}
