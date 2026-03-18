import Link from "next/link";

export function AuthFooter() {
  return (
    <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
      By continuing, you agree to Bookify&apos;s{" "}
      <Link href="/terms" className="underline hover:text-foreground">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline hover:text-foreground">
        Privacy Policy
      </Link>
      .
    </div>
  );
}
