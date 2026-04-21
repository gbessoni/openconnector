// People Data Labs search client
// Docs: https://docs.peopledatalabs.com/docs/person-search-api

const PDL_BASE = "https://api.peopledatalabs.com/v5";

export interface PDLSearchFilters {
  // Titles we're looking for, OR'd together (e.g. ["fractional cfo", "fractional coo"])
  titles?: string[];
  // Keyword match on job title (looser)
  title_keywords?: string;
  // Countries (lowercase, e.g. "united states")
  countries?: string[];
  // Company size buckets: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+"
  company_sizes?: string[];
  // Industry keywords
  industries?: string[];
  // Max records to return (PDL max is 100 per request)
  size?: number;
}

export interface PDLPerson {
  id: string;
  full_name: string | null;
  job_title: string | null;
  job_company_name: string | null;
  job_company_website: string | null;
  job_company_size: string | null;
  industry: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  location_name: string | null;
  location_country: string | null;
  work_email: boolean | string | null;
  [k: string]: unknown;
}

export interface PDLSearchResult {
  status: number;
  total: number;
  data: PDLPerson[];
  error?: { type: string; message: string };
}

function buildQuery(filters: PDLSearchFilters): Record<string, unknown> {
  const must: Record<string, unknown>[] = [];

  // Titles: bool/should with match_phrase (OR logic; default is match-at-least-one
  // when there's no sibling must — PDL doesn't accept minimum_should_match)
  if (filters.titles && filters.titles.length > 0) {
    must.push({
      bool: {
        should: filters.titles.map((t) => ({
          match_phrase: { job_title: t.toLowerCase() },
        })),
      },
    });
  } else if (filters.title_keywords) {
    must.push({ match: { job_title: filters.title_keywords.toLowerCase() } });
  }

  // Countries: terms is a native OR filter
  if (filters.countries && filters.countries.length > 0) {
    must.push({
      terms: {
        location_country: filters.countries.map((c) => c.toLowerCase()),
      },
    });
  }

  if (filters.company_sizes && filters.company_sizes.length > 0) {
    must.push({
      terms: { job_company_size: filters.company_sizes },
    });
  }

  // Industries: bool/should with match_phrase
  if (filters.industries && filters.industries.length > 0) {
    must.push({
      bool: {
        should: filters.industries.map((i) => ({
          match_phrase: { industry: i.toLowerCase() },
        })),
      },
    });
  }

  return {
    bool: { must },
  };
}

export async function searchPeople(
  filters: PDLSearchFilters
): Promise<PDLSearchResult> {
  const apiKey = process.env.PDL_API_KEY;
  if (!apiKey) {
    throw new Error("PDL_API_KEY is not set");
  }

  const body = {
    size: Math.min(Math.max(filters.size ?? 25, 1), 100),
    query: buildQuery(filters),
  };

  const res = await fetch(`${PDL_BASE}/person/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as PDLSearchResult;
  return json;
}

// Maps PDL person record to our DB shape
export interface ProspectInsert {
  pdl_id: string;
  full_name: string;
  job_title: string | null;
  job_company_name: string | null;
  job_company_website: string | null;
  job_company_size: string | null;
  industry: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  location_name: string | null;
  location_country: string | null;
  work_email_available: boolean;
  raw_data: Record<string, unknown>;
}

export function toProspectInsert(p: PDLPerson): ProspectInsert | null {
  if (!p.full_name) return null;
  return {
    pdl_id: p.id,
    full_name: p.full_name,
    job_title: p.job_title ?? null,
    job_company_name: p.job_company_name ?? null,
    job_company_website: (p.job_company_website as string | null) ?? null,
    job_company_size: p.job_company_size ?? null,
    industry: p.industry ?? null,
    linkedin_url: (p.linkedin_url as string | null) ?? null,
    twitter_url: (p.twitter_url as string | null) ?? null,
    location_name: (p.location_name as string | null) ?? null,
    location_country: (p.location_country as string | null) ?? null,
    work_email_available: !!p.work_email,
    raw_data: p as unknown as Record<string, unknown>,
  };
}
