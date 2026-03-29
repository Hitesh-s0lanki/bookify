"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { BookOpen } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const called = useRef(false);

  useEffect(() => {
    if (!isLoaded || called.current) return;
    called.current = true;

    fetch("/api/users/onboard", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.alreadyExists) {
          router.replace("/onboarding-error");
        } else {
          router.replace("/");
        }
      })
      .catch(() => {
        // On error still send to home — don't block the user
        router.replace("/");
      });
  }, [isLoaded, router]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Logo */}
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
        <BookOpen className="size-7 text-primary" />
      </div>

      {/* Avatar + name */}
      {isLoaded && user && (
        <div className="flex flex-col items-center gap-3">
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt={user.fullName ?? "Your avatar"}
              width={64}
              height={64}
              className="rounded-full ring-2 ring-primary/20"
              unoptimized
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
              {(user.firstName ?? "U")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-bold">
              Welcome, {user.firstName ?? "Reader"}!
            </p>
            <p className="text-sm text-muted-foreground">
              Setting up your library…
            </p>
          </div>
        </div>
      )}

      {/* Spinner */}
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
