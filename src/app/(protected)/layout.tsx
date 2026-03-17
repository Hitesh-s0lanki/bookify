import { auth } from "@clerk/nextjs/server";

import { AppShell } from "@/components/layout/app-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();

  return <AppShell>{children}</AppShell>;
}
