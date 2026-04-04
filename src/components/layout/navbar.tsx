"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Library,
  Menu,
  LogOut,
  Search,
  ChevronRight,
  CreditCard,
  X,
  House,
  Upload,
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
const CustomUserMenu = dynamic(
  () => import("@/components/layout/custom-user-menu").then((m) => m.CustomUserMenu),
  { ssr: false }
);
import { GenerateAvatar } from "@/components/ui/generate-avatar";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: Library },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

// Links shown in the desktop nav bar (first 4)
const DESKTOP_NAV_COUNT = 4;

export function Navbar() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery =
    pathname === "/search" ? (searchParams.get("q") ?? "") : "";
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const submitSearch = (value: string) => {
    const normalized = value.trim();
    setSearchOpen(false);
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-linear-to-r from-primary/60 via-primary to-primary/60" />

      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 font-bold tracking-tight transition-opacity duration-200 hover:opacity-80"
        >
          <Image src="/logo.png" alt="Bookify" width={26} height={26} />
          <span className="text-base text-primary">Bookify</span>
        </Link>

        {/* ── Desktop nav links ── */}
        <nav className="ml-2 hidden items-center md:flex">
          {/* Separator */}
          <div className="mx-3 h-4 w-px bg-border" />
          <div className="flex items-center gap-0.5">
            {navLinks.slice(0, DESKTOP_NAV_COUNT).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Right side ── */}
        <div className="ml-auto flex items-center gap-2">
          {/* Desktop search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              submitSearch(String(formData.get("q") ?? ""));
            }}
            className="relative hidden md:block"
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              key={`desktop-${pathname}-${currentQuery}`}
              name="q"
              defaultValue={currentQuery}
              placeholder="Search books..."
              className="h-8 w-40 rounded-full border-border/60 bg-muted/50 pl-8 text-xs focus-visible:w-52 focus-visible:bg-background transition-all duration-200 lg:w-48 lg:focus-visible:w-64"
            />
          </form>

          {/* Desktop user */}
          {isSignedIn && (
            <div className="hidden md:flex">
              <CustomUserMenu />
            </div>
          )}

          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 md:hidden"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
          >
            {searchOpen ? (
              <X className="size-4" />
            ) : (
              <Search className="size-4" />
            )}
          </Button>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="size-8 border-border/60"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-72 flex-col gap-0 p-0"
              >
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Bookify" width={26} height={26} />
                    <span className="text-sm font-bold text-primary">
                      Bookify
                    </span>
                  </SheetTitle>
                </SheetHeader>

                {/* User profile */}
                {isSignedIn && user && (
                  <div className="border-b px-4 py-3">
                    <div className="flex items-center gap-3">
                      <GenerateAvatar
                        seed={userName}
                        imageUrl={user.imageUrl}
                        className="size-9"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {userName}
                        </p>
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
                    const active = isActive(link.href);
                    return (
                      <SheetClose key={link.href} asChild>
                        <Link
                          href={link.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                          <span className="flex-1">{link.label}</span>
                          <ChevronRight className="size-3.5 opacity-30" />
                        </Link>
                      </SheetClose>
                    );
                  })}
                  {isSignedIn && (
                    <SheetClose asChild>
                      <Link
                        href="/upload"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                          isActive("/upload")
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Upload className="size-4" />
                        <span className="flex-1">Upload Book</span>
                        <ChevronRight className="size-3.5 opacity-30" />
                      </Link>
                    </SheetClose>
                  )}
                </nav>

                {/* Sign out */}
                {isSignedIn && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={onSignOut}
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile search bar (expandable) */}
      {searchOpen && (
        <div className="border-t px-4 py-2 md:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              submitSearch(String(formData.get("q") ?? ""));
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              key={`mobile-${pathname}-${currentQuery}`}
              name="q"
              defaultValue={currentQuery}
              placeholder="Search books..."
              autoFocus
              className="h-9 rounded-full pl-9 text-sm"
            />
          </form>
        </div>
      )}
    </header>
  );
}
