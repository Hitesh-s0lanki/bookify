"use client";

import Link from "next/link";
import { BookOpen, ArrowRight, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuestLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestLimitModal({ open, onOpenChange }: GuestLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="size-6 text-primary" />
        </div>

        <DialogHeader className="items-center">
          <DialogTitle>You&apos;ve read 2 books as a guest</DialogTitle>
          <DialogDescription className="text-center">
            Sign up free to unlock 5 books, AI chat, and reading progress across devices.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2.5">
          <Button asChild className="w-full gap-2 rounded-full">
            <Link href="/sign-up">
              <UserPlus className="size-4" />
              Sign Up Free
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link href="/sign-in">
              Already have an account? Log In
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
