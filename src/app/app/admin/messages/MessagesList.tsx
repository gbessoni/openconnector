"use client";

import { useState } from "react";

interface Item {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  payoutAmount: number | null;
  message: string;
}

export function MessagesList({ items }: { items: Item[] }) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = items.filter((i) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(s) ||
      (i.category || "").toLowerCase().includes(s) ||
      i.message.toLowerCase().includes(s)
    );
  });

  async function copyOne(item: Item) {
    try {
      await navigator.clipboard.writeText(item.message);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  async function downloadAll() {
    const content = items
      .map(
        (i) =>
          `═══ ${i.name} ${i.category ? `(${i.category})` : ""} ═══\n\n${i.message}\n`
      )
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leapify-recruiting-messages-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="Search vendors or messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <button
          type="button"
          onClick={downloadAll}
          className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
        >
          ⬇ Download all ({items.length})
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => {
          const cut =
            item.payoutAmount != null ? item.payoutAmount * 0.3 : null;
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        {item.category}
                      </span>
                    )}
                    {cut != null && (
                      <span className="text-xs font-semibold text-green-700">
                        • up to ${cut.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        per intro
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyOne(item)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    copiedId === item.id
                      ? "bg-green-600 text-white"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {copiedId === item.id ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-4">
                {item.message}
              </pre>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-12">
          No matches.
        </p>
      )}
    </div>
  );
}
