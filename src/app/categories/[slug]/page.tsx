import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hero } from "@/components/ui/Hero";
import { CompanyCard } from "@/components/ui/CompanyCard";
import { IntroRequestCTA } from "@/components/ui/IntroRequestCTA";
import {
  getCategoriesFromCompanies,
  getCompaniesByCategory,
} from "@/lib/companies";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCategoriesFromCompanies().map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = getCategoriesFromCompanies();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  return {
    title: category.label,
    description: `Browse curated ${category.label.toLowerCase()} companies. ${category.count} vetted companies ready for introductions.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categories = getCategoriesFromCompanies();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const companies = getCompaniesByCategory(slug);

  return (
    <>
      <Hero
        title={category.label}
        subtitle={`${category.count} vetted companies ready for introductions.`}
      />

      <section className="bg-bg-light py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <CompanyCard key={company.slug} company={company} />
            ))}
          </div>
        </div>
      </section>

      <IntroRequestCTA />
    </>
  );
}
