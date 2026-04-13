import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-bg-dark text-text-light">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-serif text-xl mb-4">OpenConnector</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Skip the research. Get directly connected to the right team.
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
              <Link href="/blog" className="hover:text-accent transition-colors">
                Blog
              </Link>
              <Link href="/about" className="hover:text-accent transition-colors">
                About
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
          &copy; {new Date().getFullYear()} OpenConnector. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
