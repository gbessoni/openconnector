import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyTemplate } from "@/components/company/CompanyTemplate";
import { getAllCompanies, getCompanyBySlug } from "@/lib/companies";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllCompanies().map((company) => ({
    slug: company.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) return {};

  return {
    title: company.name,
    description: company.tagline,
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  return <CompanyTemplate company={company} />;
}
