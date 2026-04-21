import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import type { Vendor } from "@/lib/leads";
import type { StackPick } from "@/lib/anthropic";

interface StackRow {
  id: number;
  slug: string;
  query_text: string;
  stack_title: string;
  inferred_profile: {
    company_type?: string;
    stage?: string;
    size?: string;
    needs?: string[];
  };
  picks: {
    picks: StackPick[];
    summary: string;
  };
  view_count: number;
  created_at: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const stack = await queryOne<StackRow>(
    `SELECT stack_title, picks, query_text FROM stacks WHERE slug = $1`,
    [slug]
  );
  if (!stack) return {};
  const vendorCount = stack.picks?.picks?.length || 0;
  return {
    title: `${stack.stack_title} — Leapify`,
    description: `${stack.picks?.summary || "Curated vendor stack"} · ${vendorCount} picks by Greg Bessoni.`,
    openGraph: {
      title: stack.stack_title,
      description: stack.picks?.summary || "Curated vendor stack by Greg Bessoni",
      type: "article",
    },
  };
}

export default async function StackResultPage({ params }: PageProps) {
  const { slug } = await params;

  const stack = await queryOne<StackRow>(
    `SELECT id, slug, query_text, stack_title, inferred_profile, picks, view_count, created_at
     FROM stacks WHERE slug = $1`,
    [slug]
  );
  if (!stack) notFound();

  // Fire and forget view count increment (not awaited to keep page fast)
  query(`UPDATE stacks SET view_count = view_count + 1 WHERE id = $1`, [stack.id]).catch(
    () => {}
  );

  // Load the vendor records referenced by the picks
  const allSlugs = [
    ...stack.picks.picks.map((p) => p.top_pick.vendor_slug),
    ...stack.picks.picks
      .map((p) => p.alternative?.vendor_slug)
      .filter((s): s is string => !!s),
  ];

  const vendors =
    allSlugs.length > 0
      ? await query<Vendor>(
          `SELECT id, slug, name, category, description, website, country
           FROM vendors WHERE slug = ANY($1)`,
          [allSlugs]
        )
      : [];
  const vendorBySlug = new Map(vendors.map((v) => [v.slug, v]));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/stack" className="text-sm text-gray-500 hover:text-gray-900">
            ← Build your own
          </Link>
          <Link href="/" className="font-serif text-xl text-gray-900">
            Leapify
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">
            {stack.inferred_profile.company_type || "Startup Stack"}
            {stack.inferred_profile.stage &&
              ` · ${stack.inferred_profile.stage}`}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-gray-900 tracking-tight leading-tight mb-4">
            {stack.stack_title}
          </h1>
          {stack.picks?.summary && (
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              {stack.picks.summary}
            </p>
          )}
          <div className="mt-5 text-xs text-gray-500 italic">
            Based on: &ldquo;{stack.query_text}&rdquo;
          </div>
          <div className="mt-4 text-xs text-gray-400">
            Curated by Greg Bessoni · {stack.view_count + 1} views
          </div>
        </div>
      </header>

      {/* Picks */}
      <main className="px-6 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {stack.picks.picks.map((pick, i) => {
            const top = vendorBySlug.get(pick.top_pick.vendor_slug);
            const alt = pick.alternative
              ? vendorBySlug.get(pick.alternative.vendor_slug)
              : null;

            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                    {pick.category}
                  </span>
                </div>

                {/* Top pick */}
                {top && (
                  <div className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <span className="inline-block text-[10px] uppercase tracking-widest text-green-700 font-bold mb-1">
                          🏆 Top pick
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {top.name}
                        </h3>
                        {top.category && (
                          <span className="text-xs text-gray-500">
                            {top.category}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/request-intro?company=${top.slug}`}
                        className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap shrink-0"
                      >
                        Get warm intro →
                      </Link>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {pick.top_pick.reasoning}
                    </p>
                    {top.website && (
                      <a
                        href={
                          top.website.startsWith("http")
                            ? top.website
                            : `https://${top.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        {top.website} ↗
                      </a>
                    )}
                  </div>
                )}

                {/* Alternative */}
                {alt && pick.alternative && (
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div>
                        <span className="inline-block text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1">
                          Alternative
                        </span>
                        <h4 className="text-base font-semibold text-gray-900">
                          {alt.name}
                        </h4>
                      </div>
                      <Link
                        href={`/request-intro?company=${alt.slug}`}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2"
                      >
                        Get intro →
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {pick.alternative.reasoning}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto mt-10 bg-gray-900 text-white rounded-xl p-8 text-center">
          <h3 className="font-serif text-2xl md:text-3xl mb-3">
            Want a different stack?
          </h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Every company is different. Build a stack for yours — takes 30
            seconds.
          </p>
          <Link
            href="/stack"
            className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors"
          >
            Build my stack →
          </Link>
        </div>

        {/* Footer */}
        <div className="max-w-3xl mx-auto mt-8 text-center text-xs text-gray-500">
          Built with Claude · Curated by{" "}
          <a
            href="https://www.linkedin.com/in/gregbessoni"
            className="text-indigo-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Greg Bessoni
          </a>{" "}
          · Free forever
        </div>
      </main>
    </div>
  );
}
