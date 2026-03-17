import Link from "next/link";
import { BookOpen, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LibraryEmptyState() {
  return (
    <section className="flex min-h-[40vh] flex-col items-center justify-center gap-6 rounded-2xl border border-dashed bg-muted/30 py-16 text-center">
      <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 p-6 dark:from-amber-950/50 dark:to-orange-950/50">
        <BookOpen className="size-12 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Your library is empty
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Add your first book and start having AI-powered conversations about
          what you read.
        </p>
      </div>
      <Button asChild className="gap-2 rounded-full px-6">
        <Link href="/upload">
          <PlusCircle className="size-4" />
          Add Your First Book
        </Link>
      </Button>
    </section>
  );
}
