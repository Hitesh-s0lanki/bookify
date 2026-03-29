import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OnboardingErrorPage() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card px-8 py-10 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Lock className="size-5 text-muted-foreground" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-lg font-bold">Already onboarded</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your account is already set up. You don&apos;t need to visit this page again.
        </p>
      </div>

      <Button asChild className="gap-2 rounded-full">
        <Link href="/">
          Go to Home
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
