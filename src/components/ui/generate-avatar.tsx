"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type GenerateAvatarProps = {
  seed: string;
  imageUrl?: string | null;
  className?: string;
};

function getInitials(seed: string) {
  const cleaned = seed.trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

export function GenerateAvatar({ seed, imageUrl, className }: GenerateAvatarProps) {
  return (
    <Avatar className={cn("bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100", className)}>
      {imageUrl ? <AvatarImage src={imageUrl} alt={seed} /> : null}
      <AvatarFallback>{getInitials(seed)}</AvatarFallback>
    </Avatar>
  );
}
