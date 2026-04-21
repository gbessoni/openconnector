"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/app")) return null;
  if (pathname?.startsWith("/stack")) return null;
  if (pathname?.startsWith("/find-leads")) return null;

  return (
    <nav className="bg-bg-dark text-text-light">
      <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          Leapify
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/companies" className="hover:text-accent transition-colors">
            Companies
          </Link>
          <Link href="/resources" className="hover:text-accent transition-colors">
            Resources
          </Link>
          <Link href="/about" className="hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/referral_connector.html" className="hover:text-accent transition-colors">
            Referral Partner
          </Link>
          <Link
            href="/app/login"
            className="hover:text-accent transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/request-intro"
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
          >
            Get Connected
          </Link>
        </div>
      </div>
    </nav>
  );
}
