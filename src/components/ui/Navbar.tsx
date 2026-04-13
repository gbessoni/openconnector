import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-bg-dark text-text-light">
      <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-tight">
          OpenConnector
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link href="/companies" className="hover:text-accent transition-colors">
            Companies
          </Link>
          <Link href="/blog" className="hover:text-accent transition-colors">
            Blog
          </Link>
          <Link href="/about" className="hover:text-accent transition-colors">
            About
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
