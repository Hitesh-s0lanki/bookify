"use client";

import Link from "next/link";
import { Zap, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Zap className="size-6 text-primary" />
        </div>

        <DialogHeader className="items-center">
          <DialogTitle>You&apos;ve reached your 5-book limit</DialogTitle>
          <DialogDescription className="text-center">
            Upgrade to Pro for unlimited books, unlimited AI chat, and priority processing.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2.5">
          <Button asChild className="w-full gap-2 rounded-full shadow-md shadow-primary/20">
            <Link href="/pricing">
              <Zap className="size-4" />
              Upgrade to Pro
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
