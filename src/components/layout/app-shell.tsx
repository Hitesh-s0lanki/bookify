import { Suspense } from "react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="h-0.5 w-full bg-linear-to-r from-amber-500 via-orange-500 to-rose-500" />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:h-16 sm:px-6">
        <div className="h-7 w-28 rounded-md bg-muted sm:h-8 sm:w-32" />
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Suspense fallback={<NavbarFallback />}>
        <Navbar />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
