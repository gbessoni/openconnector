import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { IntroRequestCTA } from "@/components/ui/IntroRequestCTA";
import { getAllCompanies, getCategoriesFromCompanies } from "@/lib/companies";

export const metadata: Metadata = {
  title: "About",
  description:
    "I only recommend companies I've seen work. Learn about how Superconnector operates.",
};

export default function AboutPage() {
  const companies = getAllCompanies();
  const categories = getCategoriesFromCompanies();

  return (
    <>
      <Hero
        title="I only recommend companies I've seen work."
        subtitle="Superconnector is a curated referral network. No ads, no sponsorships, no pay-to-play."
      />

      <section className="bg-bg-light py-20">
        <div className="mx-auto max-w-[800px] px-6">
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
