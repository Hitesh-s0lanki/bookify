"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  Library,
  Menu,
  PlusCircle,
  Sparkles,
  UserCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Library", icon: Library },
  { href: "/upload", label: "Upload", icon: PlusCircle },
];

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      {/* Top gradient accent line */}
      <div className="h-0.5 w-full bg-linear-to-r from-amber-500 via-orange-500 to-rose-500" />

      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-lg font-bold tracking-tight transition-colors hover:text-primary"
        >
          <Image src="/logo.png" alt="Bookify" width={32} height={32} />
          <span className="bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
            Bookify
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                className="transition-all duration-200 hover:bg-primary/10"
              >
                <Link
                  href={link.href}
                  className="inline-flex items-center gap-2"
                >
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              </Button>
            );
          })}
          <Button
            variant="outline"
            className="ml-3 inline-flex items-center gap-2 border-primary/20 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
          >
            <UserCircle2 className="size-4" />
            <span>Profile</span>
          </Button>
        </nav>

        <div className="md:hidden">
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="border-primary/20"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    Bookify
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Button
                        key={link.href}
                        asChild
                        variant="ghost"
                        className="justify-start transition-all duration-200 hover:bg-primary/10"
                      >
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-2"
                        >
                          <Icon className="size-4" />
                          <span>{link.label}</span>
                        </Link>
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    className="mt-2 justify-start gap-2 border-primary/20"
                  >
                    <UserCircle2 className="size-4" />
                    <span>Profile</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation menu"
              className="border-primary/20"
            >
              <Menu className="size-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
