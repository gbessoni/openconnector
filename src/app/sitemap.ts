import type { MetadataRoute } from "next";
import { getAllCompanies, getCategoriesFromCompanies } from "@/lib/companies";
import { getAllBlogPosts } from "@/lib/mdx";

const BASE_URL = "https://superconnector.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const companies = getAllCompanies();
  const categories = getCategoriesFromCompanies();
  const posts = getAllBlogPosts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/companies`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const companyPages: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${BASE_URL}/companies/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...companyPages, ...categoryPages, ...blogPages];
}
