export function SocialProof() {
  // Sampling of real vendor names from our network
  const vendors = ["Rho", "Deel", "Ramp", "AngelList", "Fidelity"];

  return (
    <section className="px-6 py-14 border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-6">
          Built by operators from Deel, Ramp, AngelList &amp; more
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {vendors.map((v, i) => (
            <span key={v} className="flex items-center gap-2">
              <span className="text-white/70 font-semibold text-base tracking-tight px-2">
                {v}
              </span>
              {i < vendors.length - 1 && (
                <span aria-hidden="true" className="text-white/20">
                  •
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
