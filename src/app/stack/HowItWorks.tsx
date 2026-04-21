export function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Tell us about your company",
      body: "A few quick questions. Who you are, what you're running, what you need. 60 seconds.",
    },
    {
      n: "02",
      title: "We match you to 3 vendors",
      body: "Hand-picked from our vetted network, based on what you shared. No random top-10 lists.",
    },
    {
      n: "03",
      title: "Book the meetings — on your terms",
      body: "Pick one, two, or all three. We send the intros. Vendors meet you. You stay in control.",
    },
  ];

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight mb-4">
            How it works
          </h2>
          <p className="text-white/60 text-lg">
            Three steps. No cold outreach. No sales decks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s) => (
            <div
              key={s.n}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8"
            >
              <div className="text-[#5B4FE8] font-mono text-sm tracking-wider mb-5">
                {s.n}
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight">
                {s.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
