import Link from "next/link";
import { CategoryBadge } from "./CategoryBadge";
import type { Company } from "@/lib/companies";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
    >
      <CategoryBadge
        category={company.category}
        categoryLabel={company.categoryLabel}
        linked={false}
      />
      <h3 className="font-serif text-xl mt-3 mb-2 group-hover:text-accent transition-colors">
        {company.name}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        {company.tagline}
      </p>
    </Link>
  );
}
