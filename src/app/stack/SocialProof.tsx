export function SocialProof() {
  // Sampling of real vendor names from our network
  const vendors = ["Rho", "Deel", "Ramp", "AngelList", "Fidelity"];

  return (
    <section className="px-6 py-14 border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-6">
          Trusted by founders, operators, and investors across 10,000+ companies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {vendors.map((v) => (
            <span
              key={v}
              className="text-white/60 font-medium text-base tracking-tight"
            >
              {v}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
