"use client";

import { useState, useTransition } from "react";
import { searchProspectsAction } from "../../../../actions";
import type { Vendor } from "@/lib/leads";

const SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10001+",
];

// Suggest likely "connector personas" based on vendor category — people who already have the ICP in their network
function suggestPersonas(vendor: Vendor): string {
  const cat = (vendor.category || "").toLowerCase();
  if (cat.includes("banking") || cat.includes("fintech") || cat.includes("accounting") || cat.includes("finance")) {
    return "fractional cfo, fractional coo, startup advisor, venture partner";
  }
  if (cat.includes("marketing") || cat.includes("growth")) {
    return "fractional cmo, growth advisor, marketing consultant";
  }
  if (cat.includes("payroll") || cat.includes("hr") || cat.includes("recruiting")) {
    return "fractional chro, hr consultant, recruiter, talent advisor";
  }
  if (cat.includes("legal")) {
    return "startup lawyer, general counsel, venture partner";
  }
  if (cat.includes("tech") || cat.includes("saas")) {
    return "fractional cto, technical advisor, startup advisor, venture partner";
  }
  if (cat.includes("shipping") || cat.includes("logistics") || cat.includes("manufacturing")) {
    return "supply chain consultant, operations advisor, fractional coo";
  }
  return "fractional cfo, startup advisor, venture partner";
}

export function ProspectSearchForm({ vendor }: { vendor: Vendor }) {
  const [titles, setTitles] = useState(suggestPersonas(vendor));
  const [countries, setCountries] = useState("united states");
  const [industries, setIndustries] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [recordCount, setRecordCount] = useState(25);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function toggleSize(s: string) {
    setSizes((prev) => (prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("vendor_id", String(vendor.id));
      fd.set("titles", titles);
      fd.set("countries", countries);
      fd.set("industries", industries);
      fd.set("company_sizes", sizes.join(","));
      fd.set("size", String(recordCount));
      const res = await searchProspectsAction(fd);
      if (res?.error) {
        setMsg({ type: "err", text: res.error });
      } else if (res?.success) {
        setMsg({
          type: "ok",
          text: `Found ${res.found} people. Added ${res.inserted} new prospects (${res.skipped} skipped/duplicates). PDL total pool: ${res.total?.toLocaleString() || "?"}.`,
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Target job titles{" "}
          <span className="text-xs text-gray-400 font-normal">
            (comma-separated, lowercase works best)
          </span>
        </label>
        <input
          type="text"
          value={titles}
          onChange={(e) => setTitles(e.target.value)}
          placeholder="fractional cfo, venture partner, startup advisor"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <p className="text-xs text-gray-500 mt-1">
          People with these titles already know {vendor.name}&apos;s ICP. We
          pre-filled based on the category — tweak as needed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Countries{" "}
            <span className="text-xs text-gray-400 font-normal">(lowercase)</span>
          </label>
          <input
            type="text"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            placeholder="united states, canada"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Industries (optional)
          </label>
          <input
            type="text"
            value={industries}
            onChange={(e) => setIndustries(e.target.value)}
            placeholder="financial services, management consulting"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Company size (optional — holds OR logic)
        </label>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <label
              key={s}
              className={`px-2.5 py-1 text-xs font-medium rounded border cursor-pointer transition-colors ${
                sizes.includes(s)
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={sizes.includes(s)}
                onChange={() => toggleSize(s)}
                className="sr-only"
              />
              {s}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Records to pull{" "}
            <span className="text-xs text-gray-400 font-normal">(max 100)</span>
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={recordCount}
            onChange={(e) => setRecordCount(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            1 PDL credit per record returned.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {pending ? "Searching..." : "🔍 Search PDL"}
        </button>
      </div>

      {msg && (
        <div
          className={`text-sm px-3 py-2 rounded-lg ${
            msg.type === "ok"
              ? "text-green-800 bg-green-50 border border-green-200"
              : "text-red-700 bg-red-50 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}
    </form>
  );
}
