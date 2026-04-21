"use client";

import { useState, useTransition } from "react";
import { confirmMeetingsAction, type MatchedVendor } from "./actions";

export function Matches({
  leadId,
  matches,
  onConfirmed,
}: {
  leadId: number;
  matches: MatchedVendor[];
  onConfirmed: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) {
      setError("Select at least one vendor to meet with.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lead_id", String(leadId));
      fd.set("selected_vendors", Array.from(selected).join(","));
      const res = await confirmMeetingsAction(fd);
      if ("error" in res) {
        setError(res.error);
      } else {
        onConfirmed();
      }
    });
  }

  return (
    <div className="relative min-h-screen px-6 py-14 md:py-20">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(800px circle at 50% 10%, rgba(91,79,232,0.14), transparent 55%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-[#5B4FE8]/10 border border-[#5B4FE8]/30 text-[#5B4FE8] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
            ✓ Matches found
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-[-0.025em] mb-4">
            Here are your{" "}
            <span className="text-[#5B4FE8] italic font-normal">3 matches</span>
            .
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Based on what you shared, these are the best fits from our network.
            Tick the ones you want to meet with.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-10">
          {matches.map((m) => {
            const isSelected = selected.has(m.slug);
            return (
              <label
                key={m.slug}
                className={`group cursor-pointer relative bg-white/[0.03] border rounded-2xl p-6 transition-all hover:bg-white/[0.05] ${
                  isSelected
                    ? "border-[#5B4FE8] bg-[#5B4FE8]/10 shadow-[0_8px_40px_-8px_rgba(91,79,232,0.5)]"
                    : "border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(m.slug)}
                  className="sr-only"
                />

                {/* Checkbox visual */}
                <div
                  className={`absolute top-5 right-5 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#5B4FE8] border-[#5B4FE8]"
                      : "border-white/20 group-hover:border-white/40"
                  }`}
                >
                  {isSelected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 7L5.5 10.5L12 4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <div className="mb-5">
                  {m.category && (
                    <div className="text-xs uppercase tracking-widest text-white/50 mb-2">
                      {m.category}
                    </div>
                  )}
                  <h3 className="text-2xl font-semibold tracking-tight mb-2">
                    {m.name}
                  </h3>
                  {m.tagline && (
                    <p className="text-sm text-white/70 leading-relaxed">
                      {m.tagline}.
                    </p>
                  )}
                </div>

                {m.match_reason && (
                  <div className="pt-5 border-t border-white/10">
                    <div className="text-[10px] uppercase tracking-widest text-[#5B4FE8] font-semibold mb-2">
                      Why this matches you
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {m.match_reason}
                    </p>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div
                    className={`text-sm font-medium transition-colors ${
                      isSelected ? "text-[#5B4FE8]" : "text-white/50"
                    }`}
                  >
                    {isSelected
                      ? "✓ Selected — we'll book this intro"
                      : "I'd like to meet with this vendor"}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <div className="text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={submit}
            disabled={pending || selected.size === 0}
            className="inline-flex items-center gap-2 bg-[#5B4FE8] hover:bg-[#4a3ed6] disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full font-medium transition-all shadow-[0_8px_32px_-8px_rgba(91,79,232,0.6)]"
          >
            {pending
              ? "Booking..."
              : selected.size === 0
              ? "Select at least one vendor"
              : `Book my ${selected.size} selected meeting${selected.size > 1 ? "s" : ""}`}
            {selected.size > 0 && <span className="text-lg">→</span>}
          </button>

          <p className="text-xs text-white/40 mt-5">
            Greg Bessoni will send you a calendar link within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
