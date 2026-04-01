import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Bookify",
  description: "Your personal AI-enhanced reading library",
  icons: {
    icon: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en">
        <body className="antialiased">
          {children}
          <Toaster richColors position="top-center" />
          {process.env.NODE_ENV === "production" && <Analytics />}
        </body>
      </html>
    </Providers>
  );
}
