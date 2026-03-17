import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookDetailContent } from "./book-detail-content";

export default function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to Library
        </Link>
      </Button>
      <BookDetailContent params={params} />
    </div>
  );
}
