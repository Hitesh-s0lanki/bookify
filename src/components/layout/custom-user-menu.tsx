"use client";

import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Upload } from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { GenerateAvatar } from "@/components/ui/generate-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CustomUserMenu() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded || !user) return null;

  const name =
    user.fullName ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    user.firstName ||
    user.emailAddresses[0]?.emailAddress ||
    "User";
  const email = user.emailAddresses[0]?.emailAddress ?? "";

  const onSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="group relative h-8 w-8 rounded-full p-0">
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-[1px] shadow-sm dark:from-amber-700 dark:via-orange-700 dark:to-rose-700">
            <span className="block size-full rounded-full bg-background" />
          </span>
          <span className="pointer-events-none absolute -left-4 top-0 h-full w-1/2 -skew-x-12 rounded-full bg-white/50 opacity-0 blur-[1px] transition-all duration-500 group-hover:left-8 group-hover:opacity-70 dark:bg-white/20" />
          <GenerateAvatar seed={name} imageUrl={user.imageUrl} className="relative size-8" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <GenerateAvatar seed={name} imageUrl={user.imageUrl} className="size-8" />
            <div className="min-w-0">
              <p className="truncate font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex cursor-pointer items-center justify-between"
          onClick={() => router.push("/my-library")}
        >
          My Library
          <BookOpen className="size-4" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex cursor-pointer items-center justify-between"
          onClick={() => router.push("/upload")}
        >
          Upload Book
          <Upload className="size-4" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="flex cursor-pointer items-center justify-between"
          onClick={onSignOut}
        >
          Logout
          <LogOut className="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
