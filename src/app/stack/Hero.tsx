"use client";

import Link from "next/link";

export function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="relative px-6 pt-10 md:pt-16 pb-16 md:pb-24 overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(800px circle at 50% 0%, rgba(91,79,232,0.18), transparent 60%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-block text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white/90 transition-colors mb-12"
        >
          ← Leapify
        </Link>

        <div className="text-center">
          <div className="inline-block bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-white/70 px-3 py-1 rounded-full mb-6">
            Stack · by Leapify
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-semibold tracking-[-0.025em] leading-[1.02] mb-6">
            Your stack,{" "}
            <span className="text-[#5B4FE8] italic font-normal">upgraded.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            Tell us what you&apos;re running and we&apos;ll match you to 3
            vendors our network stands behind.
            <br className="hidden md:block" />
            No sales calls until you say so.
          </p>

          <button
            type="button"
            onClick={onCTA}
            className="inline-flex items-center gap-2 bg-[#5B4FE8] hover:bg-[#4a3ed6] text-white px-8 py-4 rounded-full font-medium text-base transition-all shadow-[0_8px_32px_-8px_rgba(91,79,232,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(91,79,232,0.8)]"
          >
            Find my matches
            <span className="text-lg">→</span>
          </button>

          <p className="text-xs text-white/40 mt-6">
            60-second form · zero cost · instant matches
          </p>
        </div>
      </div>
    </section>
  );
}
