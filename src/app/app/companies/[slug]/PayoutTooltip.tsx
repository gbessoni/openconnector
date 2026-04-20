"use client";

import { useState } from "react";

export function PayoutTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="About the qualified lead payout"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full border border-gray-400 text-gray-500 text-[10px] font-semibold flex items-center justify-center hover:bg-gray-100 transition-colors cursor-help"
      >
        i
      </button>
      {open && (
        <span className="absolute right-0 top-full mt-2 w-72 z-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-lg leading-relaxed text-left">
          We pay a range of amounts when a lead meets the company&apos;s criteria
          and completes an initial meeting. Exact value depends on how well the
          lead matches the company&apos;s criteria.
          <span className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 rotate-45" />
        </span>
      )}
    </span>
  );
}
