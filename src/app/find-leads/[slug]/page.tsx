import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import { ResultsView } from "./ResultsView";

interface PublicSearchRow {
  id: number;
  slug: string;
  query_text: string;
  pdl_filters: {
    titles?: string[];
    countries?: string[];
    company_sizes?: string[];
    industries?: string[];
    display_label?: string;
  };
  results_json: Array<{
    pdl_id: string;
    full_name: string;
    job_title: string | null;
    job_company_name: string | null;
    job_company_size: string | null;
    industry: string | null;
    linkedin_url: string | null;
    twitter_url: string | null;
    location_name: string | null;
    work_email_available: boolean;
  }>;
  pdl_total: number;
  pdl_returned: number;
  unlocked: boolean;
  unlock_method: string | null;
  view_count: number;
  created_at: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await queryOne<PublicSearchRow>(
    `SELECT query_text, pdl_filters, pdl_returned FROM public_searches WHERE slug = $1`,
    [slug]
  );
  if (!row) return {};
  const label = row.pdl_filters?.display_label || row.query_text;
  return {
    title: `${label} — ${row.pdl_returned} leads from Leapify`,
    description: `${row.pdl_returned} real prospects matching: ${label}. Free lead-finding tool by Leapify.`,
  };
}

export default async function FindLeadsResultPage({ params }: PageProps) {
  const { slug } = await params;
  const row = await queryOne<PublicSearchRow>(
    `SELECT * FROM public_searches WHERE slug = $1`,
    [slug]
  );
  if (!row) notFound();

  // Fire-and-forget view count increment
  query(`UPDATE public_searches SET view_count = view_count + 1 WHERE id = $1`, [
    row.id,
  ]).catch(() => {});

  const allResults = row.results_json || [];
  const label = row.pdl_filters?.display_label || row.query_text;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-serif text-xl text-gray-900">
            Leapify
          </Link>
          <Link
            href="/find-leads"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            New search →
          </Link>
        </div>
      </nav>

      <header className="bg-white border-b border-gray-200 px-6 py-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">
            ICP Match · {row.pdl_returned} results
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-gray-900 tracking-tight leading-tight mb-4">
            {label}
          </h1>
          <p className="text-sm text-gray-500">
            Based on: &ldquo;{row.query_text}&rdquo;
          </p>
          {row.pdl_total > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              PDL total pool: {row.pdl_total.toLocaleString()} people match — showing
              the top {row.pdl_returned}
            </p>
          )}
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <ResultsView
            slug={row.slug}
            queryLabel={label}
            results={allResults}
            totalCount={allResults.length}
          />

          {/* Upgrade CTA */}
          <div className="mt-10 bg-gray-900 text-white rounded-xl p-8 text-center">
            <h3 className="font-serif text-2xl md:text-3xl mb-3">
              Want unlimited searches + pitch templates + guaranteed leads?
            </h3>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              Hunter gets you unlimited ICP searches, pre-written pitch
              templates for every vendor, and 1 qualified lead with a booked
              meeting — guaranteed. $49/mo. 30% commission on every close.
            </p>
            <Link
              href="/hunter"
              className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
            >
              Join Hunter — $49/mo →
            </Link>
            <p className="text-xs text-gray-500 mt-4">
              Prefer to refer from your network instead?{" "}
              <Link
                href="/referral_connector.html"
                className="underline hover:text-white"
              >
                Free Referral Partner program →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
