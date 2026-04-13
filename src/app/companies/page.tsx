import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { CompanyCard } from "@/components/ui/CompanyCard";
import { getAllCompanies, getCategoriesFromCompanies } from "@/lib/companies";

export const metadata: Metadata = {
  title: "Companies",
  description:
    "Browse our curated directory of high-performing companies across finance, growth, operations, and more.",
};

export default function CompaniesPage() {
  const companies = getAllCompanies();
  const categories = getCategoriesFromCompanies();

  return (
    <>
      <Hero
        title="Company Directory"
        subtitle="A curated group of high-performing companies I've vetted and recommend."
      />

      <section className="bg-bg-light py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          {categories.map((category) => {
            const categoryCompanies = companies.filter(
              (c) => c.category === category.slug
            );
            return (
              <div key={category.slug} className="mb-16 last:mb-0">
                <h2 className="font-serif text-2xl mb-6">
                  {category.label}
                  <span className="text-sm font-sans text-gray-400 ml-3">
                    {category.count} {category.count === 1 ? "company" : "companies"}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryCompanies.map((company) => (
                    <CompanyCard key={company.slug} company={company} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
