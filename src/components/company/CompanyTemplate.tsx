import Link from "next/link";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CompanyCard } from "@/components/ui/CompanyCard";
import { IntroRequestCTA } from "@/components/ui/IntroRequestCTA";
import type { Company } from "@/lib/companies";
import { getRelatedCompanies } from "@/lib/companies";

interface CompanyTemplateProps {
  company: Company;
}

export function CompanyTemplate({ company }: CompanyTemplateProps) {
  const related = getRelatedCompanies(company);

  return (
    <>
      {/* Hero */}
      <section className="bg-bg-dark text-text-light py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <CategoryBadge
            category={company.category}
            categoryLabel={company.categoryLabel}
          />
          <h1 className="font-serif text-4xl md:text-6xl leading-tight mt-6 mb-4">
            {company.name}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-80 mb-8">
            {company.tagline}
          </p>
          <Link
            href={`/request-intro?company=${company.slug}`}
            className="inline-block bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-full font-medium transition-colors"
          >
            Get Connected
          </Link>
        </div>
      </section>

      {/* Overview */}
      <section className="bg-bg-light py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-3xl mb-6">Overview</h2>
            {company.description ? (
              <p className="text-gray-600 leading-relaxed text-lg">
                {company.description}
              </p>
            ) : (
              <p className="text-gray-600 leading-relaxed text-lg">
                {company.tagline}
              </p>
            )}
            {company.bestFor && (
              <div className="mt-8 p-6 bg-white rounded-xl">
                <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400 mb-2">
                  Best For
                </h3>
                <p className="text-text-primary">{company.bestFor}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      {company.features.length > 0 && (
        <section className="bg-bg-accent py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="font-serif text-3xl mb-10 text-center">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {company.features.map((feature) => (
                <div
                  key={feature}
                  className="bg-white rounded-xl p-6 text-center"
                >
                  <p className="font-medium">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why I Recommend */}
      {company.whyIRecommend && (
        <section className="bg-bg-dark text-text-light py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-3xl mb-6">Why I Recommend</h2>
              <p className="text-lg text-gray-300 leading-relaxed italic">
                &ldquo;{company.whyIRecommend}&rdquo;
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Related Companies */}
      {related.length > 0 && (
        <section className="bg-bg-light py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="font-serif text-3xl mb-10 text-center">
              Related Companies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((r) => (
                <CompanyCard key={r.slug} company={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Footer */}
      <IntroRequestCTA companySlug={company.slug} />
    </>
  );
}
