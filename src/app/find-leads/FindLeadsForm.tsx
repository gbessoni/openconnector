"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { searchLeadsAction } from "./actions";

const EXAMPLES = [
  "Fractional CFOs in US at SaaS companies Series A-C",
  "VPs of Marketing at D2C ecommerce brands doing $5M+",
  "Heads of Operations at 3PLs with 50-200 employees",
  "General Counsels at VC-backed startups",
];

export function FindLeadsForm() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUpgrade(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("query", query);
      const res = await searchLeadsAction(fd);
      if (res?.error) {
        setError(res.error);
        if (res.upgrade) setUpgrade(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={3}
        placeholder="Fractional CFOs in US at SaaS companies Series A-C..."
        maxLength={1000}
        disabled={pending}
        className="w-full px-4 py-3 text-base resize-none border-0 focus:outline-none focus:ring-0 placeholder:text-gray-400 disabled:opacity-60 bg-transparent"
      />
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{query.length} / 1000</span>
        <button
          type="submit"
          disabled={pending || query.trim().length < 10}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Searching..." : "Find 25 leads →"}
        </button>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
          {upgrade && (
            <div className="mt-2">
              <Link
                href="/hunter"
                className="inline-block bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
              >
                Join Hunter — $49/mo →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="text-xs text-gray-400 self-center mr-1">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setQuery(ex)}
            disabled={pending}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 decoration-dotted disabled:opacity-40"
          >
            {ex.slice(0, 36)}
            {ex.length > 36 ? "..." : ""}
          </button>
        ))}
      </div>
    </form>
  );
}
