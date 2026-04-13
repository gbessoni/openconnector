import { describe, it, expect } from "vitest";
import {
  getAllCompanies,
  getCompanyBySlug,
  getCompaniesByCategory,
  getCategoriesFromCompanies,
  getRelatedCompanies,
} from "@/lib/companies";

describe("getAllCompanies", () => {
  it("returns all companies", () => {
    const companies = getAllCompanies();
    expect(companies.length).toBeGreaterThan(0);
    expect(companies.length).toBe(52);
  });

  it("each company has required fields", () => {
    const companies = getAllCompanies();
    for (const company of companies) {
      expect(company.slug).toBeTruthy();
      expect(company.name).toBeTruthy();
      expect(company.tagline).toBeTruthy();
      expect(company.category).toBeTruthy();
      expect(company.categoryLabel).toBeTruthy();
      expect(Array.isArray(company.features)).toBe(true);
    }
  });

  it("slugs are unique", () => {
    const companies = getAllCompanies();
    const slugs = companies.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getCompanyBySlug", () => {
  it("returns correct company for valid slug", () => {
    const company = getCompanyBySlug("rho");
    expect(company).toBeDefined();
    expect(company!.name).toBe("Rho");
    expect(company!.category).toBe("banking-finance");
  });

  it("returns undefined for invalid slug", () => {
    const company = getCompanyBySlug("nonexistent-company");
    expect(company).toBeUndefined();
  });
});

describe("getCompaniesByCategory", () => {
  it("returns companies in the given category", () => {
    const companies = getCompaniesByCategory("banking-finance");
    expect(companies.length).toBeGreaterThan(0);
    for (const c of companies) {
      expect(c.category).toBe("banking-finance");
    }
  });

  it("returns empty array for nonexistent category", () => {
    const companies = getCompaniesByCategory("nonexistent");
    expect(companies).toEqual([]);
  });
});

describe("getCategoriesFromCompanies", () => {
  it("derives categories from company data", () => {
    const categories = getCategoriesFromCompanies();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.length).toBe(13);
  });

  it("each category has slug, label, and count", () => {
    const categories = getCategoriesFromCompanies();
    for (const cat of categories) {
      expect(cat.slug).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.count).toBeGreaterThan(0);
    }
  });

  it("category counts match actual company counts", () => {
    const categories = getCategoriesFromCompanies();
    const allCompanies = getAllCompanies();
    for (const cat of categories) {
      const actual = allCompanies.filter((c) => c.category === cat.slug).length;
      expect(cat.count).toBe(actual);
    }
  });
});

describe("getRelatedCompanies", () => {
  it("returns companies in the same category excluding self", () => {
    const rho = getCompanyBySlug("rho")!;
    const related = getRelatedCompanies(rho);
    expect(related.length).toBeGreaterThan(0);
    for (const r of related) {
      expect(r.category).toBe(rho.category);
      expect(r.slug).not.toBe("rho");
    }
  });

  it("respects limit parameter", () => {
    const rho = getCompanyBySlug("rho")!;
    const related = getRelatedCompanies(rho, 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });
});
