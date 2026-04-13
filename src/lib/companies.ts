import companiesData from "@/data/companies.json";

export interface Company {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  categoryLabel: string;
  website: string;
  description: string;
  features: string[];
  bestFor: string;
  whyIRecommend: string;
}

export interface Category {
  slug: string;
  label: string;
  count: number;
}

const companies: Company[] = companiesData;

export function getAllCompanies(): Company[] {
  return companies;
}

export function getCompanyBySlug(slug: string): Company | undefined {
  return companies.find((c) => c.slug === slug);
}

export function getCompaniesByCategory(category: string): Company[] {
  return companies.filter((c) => c.category === category);
}

export function getCategoriesFromCompanies(): Category[] {
  const categoryMap = new Map<string, { label: string; count: number }>();

  for (const company of companies) {
    const existing = categoryMap.get(company.category);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(company.category, {
        label: company.categoryLabel,
        count: 1,
      });
    }
  }

  return Array.from(categoryMap.entries()).map(([slug, { label, count }]) => ({
    slug,
    label,
    count,
  }));
}

export function getRelatedCompanies(
  company: Company,
  limit: number = 4
): Company[] {
  return companies
    .filter((c) => c.category === company.category && c.slug !== company.slug)
    .slice(0, limit);
}
