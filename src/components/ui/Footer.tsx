"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/app")) return null;
  if (pathname?.startsWith("/stack")) return null;
  if (pathname?.startsWith("/find-leads")) return null;
  if (pathname?.startsWith("/hunter")) return null;

  return (
    <footer className="bg-bg-dark text-text-light">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-serif text-xl mb-4">Leapify</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted connector to the products and services that actually work. We do the deep dives so you don't have to.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4 uppercase tracking-wider text-gray-400">
              Navigate
            </h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/companies" className="hover:text-accent transition-colors">
                Companies
              </Link>
              <Link href="/resources" className="hover:text-accent transition-colors">
                Resources
              </Link>
              <Link href="/about" className="hover:text-accent transition-colors">
                About
              </Link>
              <Link href="/stack" className="hover:text-accent transition-colors">
                Stack (vendor match)
              </Link>
              <Link href="/find-leads" className="hover:text-accent transition-colors">
                Find Leads
              </Link>
              <Link href="/hunter" className="hover:text-accent transition-colors">
                Hunter
              </Link>
              <Link href="/referral_connector.html" className="hover:text-accent transition-colors">
                Referral Partner
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-4 uppercase tracking-wider text-gray-400">
              Get Started
            </h4>
            <Link
              href="/request-intro"
              className="inline-block bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
            >
              Get Connected
            </Link>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Leapify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
