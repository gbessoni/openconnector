"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPayout, type Vendor } from "@/lib/leads";

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

function parseIndustries(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CompaniesBrowser({
  vendors,
  isAdmin,
  commissionRate,
}: {
  vendors: Vendor[];
  isAdmin: boolean;
  commissionRate: number;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(vendors.map((v) => v.category).filter((c): c is string => !!c))
      ).sort(),
    [vendors]
  );

  // Collect every distinct "Looking for customers in" value across the DB
  const targetIndustries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of vendors) {
      for (const t of parseIndustries(v.target_industries)) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    // Sort by count desc, then alpha
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }));
  }, [vendors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      if (activeCategory && v.category !== activeCategory) return false;
      if (activeTarget) {
        const list = parseIndustries(v.target_industries).map((s) =>
          s.toLowerCase()
        );
        if (!list.includes(activeTarget.toLowerCase())) return false;
      }
      if (!q) return true;
      const hay = [
        v.name,
        v.category ?? "",
        v.description ?? "",
        v.long_description ?? "",
        v.target_industries ?? "",
        v.icp ?? "",
        v.icp_bullets ?? "",
        v.primary_buyer ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [vendors, search, activeCategory, activeTarget]);

  const now = Date.now();

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search by name, title, keyword (e.g. "CFO", "fractional", "ecommerce")...'
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* "Looking for customers in" (target industries) */}
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Looking for customers in
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTarget(null)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTarget === null
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Any
          </button>
          {targetIndustries.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() =>
                setActiveTarget(activeTarget === t.label ? null : t.label)
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTarget === t.label
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] ${
                  activeTarget === t.label ? "text-white/70" : "text-gray-500"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Category
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeCategory === null
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Result meta */}
      <div className="text-xs text-gray-500 mb-3 flex items-center gap-3 flex-wrap">
        <span>
          Showing{" "}
          <span className="font-medium text-gray-700">{filtered.length}</span>{" "}
          of {vendors.length}
        </span>
        {(activeCategory || activeTarget || search) && (
          <button
            type="button"
            onClick={() => {
              setActiveCategory(null);
              setActiveTarget(null);
              setSearch("");
            }}
            className="text-indigo-600 hover:underline"
          >
            Clear all filters
          </button>
        )}
        {activeCategory && (
          <span className="bg-gray-900 text-white rounded px-2 py-0.5">
            category: {activeCategory}
            <button
              onClick={() => setActiveCategory(null)}
              className="ml-1.5 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </span>
        )}
        {activeTarget && (
          <span className="bg-indigo-600 text-white rounded px-2 py-0.5">
            looking for: {activeTarget}
            <button
              onClick={() => setActiveTarget(null)}
              className="ml-1.5 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          No matches. Try a different search or clear the filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const numericAmount =
              typeof v.payout_amount === "string"
                ? parseFloat(v.payout_amount)
                : v.payout_amount;
            const connectorPayout =
              numericAmount != null ? Number(numericAmount) * commissionRate : null;

            const createdMs = new Date(v.created_at).getTime();
            const isNew = now - createdMs < NEW_WINDOW_MS;
            const vendorTargets = parseIndustries(v.target_industries);

            return (
              <Link
                key={v.id}
                href={`/app/companies/${v.slug}`}
                className="relative bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
              >
                {isNew && (
                  <span className="absolute top-3 right-3 bg-green-100 text-green-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    New
                  </span>
                )}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={isNew ? "pr-14" : ""}>
                    <h3 className="font-semibold text-gray-900 group-hover:underline">
                      {v.name}
                    </h3>
                    {v.category && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveCategory(
                            activeCategory === v.category ? null : v.category
                          );
                        }}
                        className="inline-block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1 hover:text-gray-900 transition-colors cursor-pointer"
                      >
                        {v.category}
                      </button>
                    )}
                  </div>
                  {!isNew && (
                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                        Qualified Lead Payout
                      </div>
                      <div className="text-sm font-semibold text-green-700">
                        {isAdmin
                          ? v.payout_text || "—"
                          : connectorPayout !== null
                          ? `up to ${formatPayout(connectorPayout)}`
                          : "—"}
                      </div>
                    </div>
                  )}
                </div>
                {isNew && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      Qualified Lead Payout
                    </div>
                    <div className="text-sm font-semibold text-green-700">
                      {isAdmin
                        ? v.payout_text || "—"
                        : connectorPayout !== null
                        ? `up to ${formatPayout(connectorPayout)}`
                        : "—"}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 line-clamp-3">
                  {v.description}
                </p>

                {vendorTargets.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium block mb-1.5">
                      Looking for customers in
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {vendorTargets.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveTarget(activeTarget === t ? null : t);
                          }}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                            activeTarget === t
                              ? "bg-indigo-600 text-white"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {v.country && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {v.country}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
