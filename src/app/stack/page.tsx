import type { Metadata } from "next";
import Link from "next/link";
import { query } from "@/lib/db";
import { StackForm } from "./StackForm";

export const metadata: Metadata = {
  title: "Build your startup stack — Leapify",
  description:
    "Tell us about your company. Get a curated shortlist of vetted vendors personally recommended by Greg Bessoni. Free, no signup, warm intros included.",
};

export const revalidate = 300; // Re-render popular-stacks list every 5 min

interface PopularStack {
  slug: string;
  stack_title: string;
  view_count: number;
  created_at: string;
}

export default async function StackHomePage() {
  const popular = await query<PopularStack>(
    `SELECT slug, stack_title, view_count, created_at
     FROM stacks ORDER BY view_count DESC, created_at DESC LIMIT 12`
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 inline-block mb-6"
          >
            ← Leapify
          </Link>
          <h1 className="font-serif text-4xl md:text-6xl text-gray-900 tracking-tight leading-[1.1] mb-5">
            Tell me about your company.
            <br />
            <span className="italic text-accent">I&apos;ll build your stack.</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
            57 hand-picked vendors. Real warm intros, not affiliate links.
            Curated by Greg Bessoni. Free, no signup.
          </p>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-5 max-w-2xl mx-auto">
            <StackForm />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Built with Claude. Every pick cites real ICP data. No made-up vendors.
          </p>
        </div>
      </section>

      {/* Popular stacks */}
      {popular.length > 0 && (
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-4 text-center">
              Recent stacks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {popular.map((s) => (
                <Link
                  key={s.slug}
                  href={`/stack/${s.slug}`}
                  className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-gray-400 hover:shadow-sm transition-all group"
                >
                  <div className="font-medium text-gray-900 group-hover:underline">
                    {s.stack_title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {s.view_count} views
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-gray-900 text-white px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl mb-10 text-center">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              n="1"
              title="Tell us about your company"
              body="Stage, size, what you need. Type it like you'd text a friend. No forms."
            />
            <Step
              n="2"
              title="Get your curated stack"
              body="AI matches you against 57 vetted vendors. Real reasoning. No filler. Shareable link."
            />
            <Step
              n="3"
              title="Get warm intros"
              body="Like what you see? Hit 'Get intro' — Greg personally introduces you. No cold emails."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="font-serif text-4xl text-accent mb-3">{n}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
    </div>
  );
}
