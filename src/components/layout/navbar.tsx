"use client";

import Link from "next/link";
import { BookOpenText, Library, Menu, PlusCircle, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Library", icon: Library },
  { href: "/books/new", label: "Add New", icon: PlusCircle },
];

export function Navbar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <BookOpenText className="size-5" />
          <span>Bookify</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Button key={link.href} asChild variant="ghost">
                <Link href={link.href} className="inline-flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              </Button>
            );
          })}
          <Button variant="outline" className="ml-2 inline-flex items-center gap-2">
            <UserCircle2 className="size-4" />
            <span>User Profile</span>
          </Button>
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Bookify</SheetTitle>
              </SheetHeader>
              <div className="mt-6 grid gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Button key={link.href} asChild variant="ghost" className="justify-start">
                      <Link href={link.href} className="inline-flex items-center gap-2">
                        <Icon className="size-4" />
                        <span>{link.label}</span>
                      </Link>
                    </Button>
                  );
                })}
                <Button variant="outline" className="mt-2 justify-start gap-2">
                  <UserCircle2 className="size-4" />
                  <span>User Profile</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
