import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Image src="/logo.png" alt="Bookify" width={32} height={32} />
          <span>
            &copy; {new Date().getFullYear()} Bookify. All rights reserved.
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
