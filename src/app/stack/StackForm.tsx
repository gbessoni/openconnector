"use client";

import { useState, useTransition } from "react";
import { generateStackAction } from "./actions";

const EXAMPLES = [
  "20-person B2B SaaS, Series A, US-based, need banking + payroll + sales tax",
  "Ecommerce apparel brand, $5M ARR, shipping out of 3PL, need fulfillment optimization",
  "Solo founder, pre-seed, Delaware C-corp, just raised $500K",
  "$10M CPG food brand, wholesale into Target and Whole Foods",
];

export function StackForm() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("query", query);
      const res = await generateStackAction(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={3}
        placeholder="We're a 20-person B2B SaaS, Series A, US-based, need banking + payroll + sales tax..."
        maxLength={2000}
        disabled={pending}
        className="w-full px-4 py-3 text-base resize-none border-0 focus:outline-none focus:ring-0 placeholder:text-gray-400 disabled:opacity-60 bg-transparent"
      />
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">{query.length} / 2000</span>
        <button
          type="submit"
          disabled={pending || query.trim().length < 10}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Building..." : "Build my stack →"}
        </button>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-gray-400 self-center mr-1">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setQuery(ex)}
            disabled={pending}
            className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 decoration-dotted disabled:opacity-40"
          >
            {ex.slice(0, 40)}...
          </button>
        ))}
      </div>
    </form>
  );
}
