import { BookOpen } from "lucide-react";
import Link from "next/link";

export function MobileLogo() {
  return (
    <div className="p-6 lg:hidden">
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-70"
      >
        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <BookOpen className="size-4.5" />
        </div>
        <span className="text-lg font-bold tracking-tight">Bookify</span>
      </Link>
    </div>
  );
}
