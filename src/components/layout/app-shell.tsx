import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
