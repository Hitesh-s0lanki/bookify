import { DecorativePanel } from "./_components/decorative-panel";
import { MobileLogo } from "./_components/mobile-logo";
import { AuthFooter } from "./_components/auth-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <DecorativePanel />

      {/* Right panel — auth form */}
      <div className="flex flex-col">
        <MobileLogo />

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="animate-fade-in-up w-full max-w-sm">{children}</div>
        </div>

        <AuthFooter />
      </div>
    </div>
  );
}
