import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/ui/Hero";
import { IntroRequestCTA } from "@/components/ui/IntroRequestCTA";
import { getAllCompanies, getCategoriesFromCompanies } from "@/lib/companies";

export const metadata: Metadata = {
  title: "About",
  description:
    "I only recommend companies I've seen work. Learn about how OpenConnector operates.",
};

export default function AboutPage() {
  const companies = getAllCompanies();
  const categories = getCategoriesFromCompanies();

  return (
    <>
      <Hero
        title="I only recommend companies I've seen work."
        subtitle="OpenConnector is a curated referral network. No ads, no sponsorships, no pay-to-play."
      />

      <section className="bg-bg-light py-20">
        <div className="mx-auto max-w-[800px] px-6">
          {/* Profile */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
            <a
              href="https://www.linkedin.com/in/gregbessoni"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Image
                src="/images/greg-bessoni.jpg"
                alt="Greg Bessoni"
                width={160}
                height={160}
                className="rounded-full"
              />
            </a>
            <div>
              <h2 className="font-serif text-3xl mb-2">Greg Bessoni</h2>
              <p className="text-sm text-gray-400 mb-4">
                Serial founder, 20+ years building businesses
              </p>
              <a
                href="https://www.linkedin.com/in/gregbessoni"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>

          <div className="space-y-8 text-lg text-gray-600 leading-relaxed">
            <p>
              Every company in this directory has been personally vetted. I only
              add companies after I've seen them deliver for real clients.
            </p>
            <p>
              The model is simple: when there's a strong fit between a company
              and a potential client, I make a direct introduction. No cold
              outreach, no sales decks, no middlemen.
            </p>
            <p>
              I review every intro request personally. If it's not a strong fit,
              I'll tell you. I'd rather say no than waste anyone's time.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="font-serif text-4xl text-text-primary">
                {companies.length}+
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Vetted Companies
              </div>
            </div>
            <div>
              <div className="font-serif text-4xl text-text-primary">
                {categories.length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Categories</div>
            </div>
            <div>
              <div className="font-serif text-4xl text-text-primary">100%</div>
              <div className="text-sm text-gray-400 mt-1">
                Personally Reviewed
              </div>
            </div>
          </div>
        </div>
      </section>

      <IntroRequestCTA />
    </>
  );
}
