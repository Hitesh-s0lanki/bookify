"use client";

import Image from "next/image";
import { Mic } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
}

const FALLBACK_COVER = "/file.svg";

export function BookCard({ book }: BookCardProps) {
  const [coverSrc, setCoverSrc] = useState(book.coverUrl || FALLBACK_COVER);

  return (
    <Card className="overflow-hidden pt-0">
      <div className="relative aspect-[3/4] w-full bg-muted">
        <Image
          src={coverSrc}
          alt={`${book.title} cover`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 20vw"
          onError={() => setCoverSrc(FALLBACK_COVER)}
        />
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2">{book.title}</CardTitle>
        <CardDescription className="line-clamp-1">{book.author}</CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <Button className="w-full gap-2">
          <Mic className="size-4" />
          <span>Start Conversation</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
