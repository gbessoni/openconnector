"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPayout, type Vendor } from "@/lib/leads";

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

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

  const categories = useMemo(
    () =>
      Array.from(
        new Set(vendors.map((v) => v.category).filter((c): c is string => !!c))
      ).sort(),
    [vendors]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      if (activeCategory && v.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [
        v.name,
        v.category ?? "",
        v.description ?? "",
        v.target_industries ?? "",
        v.icp ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [vendors, search, activeCategory]);

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
          placeholder="Search by name, category, ICP, or keyword..."
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

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-5">
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

      {/* Result meta */}
      <div className="text-xs text-gray-500 mb-3">
        Showing <span className="font-medium text-gray-700">{filtered.length}</span>{" "}
        of {vendors.length}
        {activeCategory && (
          <>
            {" "}in <span className="font-medium text-gray-700">{activeCategory}</span>
          </>
        )}
        {search && (
          <>
            {" "}for &ldquo;<span className="font-medium text-gray-700">{search}</span>&rdquo;
          </>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          No matches. Try a different search or clear the filter.
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
                {/* If we stole the top right corner for "New", show payout below */}
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
                {v.target_industries && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                      Target:
                    </span>{" "}
                    <span className="text-xs text-gray-600">
                      {v.target_industries}
                    </span>
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
