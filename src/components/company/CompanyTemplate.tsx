import Link from "next/link";
import Image from "next/image";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CompanyCard } from "@/components/ui/CompanyCard";
import type { Company } from "@/lib/companies";
import { getRelatedCompanies } from "@/lib/companies";

interface CompanyTemplateProps {
  company: Company;
}

export function CompanyTemplate({ company }: CompanyTemplateProps) {
  const related = getRelatedCompanies(company);

  return (
    <>
      {/* Hero — Lead with YOUR value, not the company's marketing */}
      <section className="bg-bg-dark text-text-light py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-3xl">
            <CategoryBadge
              category={company.category}
              categoryLabel={company.categoryLabel}
            />
            <h1 className="font-serif text-4xl md:text-5xl leading-tight mt-6 mb-4">
              Get a warm intro to {company.name}.
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-2xl">
              I review every request personally. If there&apos;s a strong fit,
              I&apos;ll connect you directly with their team. No cold outreach,
              no gatekeepers.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                href={`/request-intro?company=${company.slug}`}
                className="inline-block bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-medium transition-colors"
              >
                Get Connected
              </Link>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-4 rounded-full font-medium transition-colors"
                >
                  Visit {company.name}&apos;s site
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar — Greg's personal endorsement, up front */}
      <section className="bg-bg-accent py-8 border-b border-gray-200">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex items-center gap-4">
            <Image
              src="/images/greg-bessoni.jpg"
              alt="Greg Bessoni"
              width={48}
              height={48}
              className="rounded-full"
            />
            <div>
              {company.whyIRecommend ? (
                <p className="text-text-primary">
                  &ldquo;{company.whyIRecommend}&rdquo;
                </p>
              ) : (
                <p className="text-text-primary">
                  I&apos;ve vetted {company.name} personally. They deliver for
                  real clients.
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Greg Bessoni, Leapify
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What they do + Who it's for — Side by side, not stacked */}
      <section className="bg-bg-light py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-serif text-2xl mb-4">
                What {company.name} does
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {company.description || company.tagline}
              </p>
            </div>
            <div>
              <h2 className="font-serif text-2xl mb-4">Who it&apos;s for</h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">
                {company.bestFor || company.tagline}
              </p>
              {company.features.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-3">
                    Key capabilities
                  </h3>
                  <ul className="space-y-2">
                    {company.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="text-accent mt-1">&#10003;</span>
                        <span className="text-text-primary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Inline CTA — Form teaser, not just a button */}
      <section className="bg-bg-dark text-text-light py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-serif text-3xl mb-4">
              Think {company.name} could be a fit?
            </h2>
            <p className="text-gray-400 mb-6">
              Tell me what you&apos;re looking for. If it&apos;s a match,
              I&apos;ll make the introduction within 48 hours.
            </p>
            <Link
              href={`/request-intro?company=${company.slug}`}
              className="inline-block bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-medium transition-colors"
            >
              Get Connected to {company.name}
            </Link>
          </div>
        </div>
      </section>

      {/* Also in this space — Positioned as curation, not just "related" */}
      {related.length > 0 && (
        <section className="bg-bg-light py-16">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mb-8">
              <h2 className="font-serif text-2xl">
                Also in {company.categoryLabel}
              </h2>
              <p className="text-gray-500 mt-1">
                Other companies I&apos;ve vetted in this space. Not sure which
                is right? I can help you decide.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((r) => (
                <CompanyCard key={r.slug} company={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
