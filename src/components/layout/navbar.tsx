"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Library,
  Menu,
  LogOut,
  Search,
  PlusCircle,
  Sparkles,
  BookOpen,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CustomUserMenu } from "@/components/layout/custom-user-menu";
import { GenerateAvatar } from "@/components/ui/generate-avatar";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Library", icon: Library },
  { href: "/upload", label: "Upload", icon: PlusCircle },
  { href: "/my-library", label: "My Library", icon: BookOpen },
];

export function Navbar() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery =
    pathname === "/search" ? (searchParams.get("q") ?? "") : "";
  const [open, setOpen] = useState(false);

  const submitSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
  };

  const isSignedIn = Boolean(isLoaded && user);

  const onSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
  };

  const userName =
    user?.fullName ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress ||
    "User";
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      {/* Top gradient accent line */}
      <div className="h-0.5 w-full bg-linear-to-r from-amber-500 via-orange-500 to-rose-500" />

      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight transition-colors hover:text-primary"
        >
          <Image src="/logo.png" alt="Bookify" width={28} height={28} className="sm:size-8" />
          <span className="bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
            Bookify
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-2 md:flex">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              submitSearch(String(formData.get("q") ?? ""));
            }}
            className="relative w-52 lg:w-72"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              key={`desktop-${pathname}-${currentQuery}`}
              name="q"
              defaultValue={currentQuery}
              placeholder="Search books..."
              className="h-9 pl-9"
            />
          </form>
          <div className="flex items-center gap-1">
            {navLinks.slice(0, 2).map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative inline-flex h-9 items-center gap-2 px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                  <span className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-250 group-hover:scale-x-100" />
                </Link>
              );
            })}
          </div>
          {isSignedIn && (
            <div className="ml-1 flex h-9 items-center">
              <CustomUserMenu />
            </div>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
                className="size-9 border-primary/20"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[280px] flex-col gap-0 p-0">
              <SheetHeader className="border-b p-4">
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-500" />
                  <span className="bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
                    Bookify
                  </span>
                </SheetTitle>
              </SheetHeader>

              {/* User profile section */}
              {isSignedIn && user && (
                <div className="border-b p-4">
                  <div className="flex items-center gap-3">
                    <GenerateAvatar
                      seed={userName}
                      imageUrl={user.imageUrl}
                      className="size-10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{userName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex-1 p-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <SheetClose key={link.href} asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                        <span className="flex-1">{link.label}</span>
                        <ChevronRight className="size-4 opacity-40" />
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>

              {/* Sign out */}
              {isSignedIn && (
                <div className="border-t p-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={onSignOut}
                  >
                    <LogOut className="size-4" />
                    Logout
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="border-t px-4 py-2 md:hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            submitSearch(String(formData.get("q") ?? ""));
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={`mobile-${pathname}-${currentQuery}`}
            name="q"
            defaultValue={currentQuery}
            placeholder="Search books..."
            className="h-9 pl-9"
          />
        </form>
      </div>
    </header>
  );
}
