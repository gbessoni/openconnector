"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { submitHunterSignupAction } from "./actions";
import { trackHunterSignup } from "@/lib/track";

interface UTMBundle {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
}

export function HunterLanding({
  searchParamsPromise,
}: {
  searchParamsPromise?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [utm, setUtm] = useState<UTMBundle>({});

  useEffect(() => {
    if (!searchParamsPromise) return;
    searchParamsPromise.then((p) => {
      const pick = (k: string) => (typeof p?.[k] === "string" ? (p[k] as string) : undefined);
      setUtm({
        utm_source: pick("utm_source"),
        utm_medium: pick("utm_medium"),
        utm_campaign: pick("utm_campaign"),
        utm_content: pick("utm_content"),
        utm_term: pick("utm_term"),
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
      });
    });
  }, [searchParamsPromise]);

  function openSignup() {
    setModalOpen(true);
  }

  return (
    <div className="bg-[#0a0a0a] text-white" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {/* Google Font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      />

      <Hero onCTA={openSignup} />
      <Pitch />
      <Features />
      <HowItWorks />
      <Calculator onCTA={openSignup} />
      <Guarantee />
      <Testimonials />
      <FAQ />
      <FinalCTA onCTA={openSignup} />
      <HunterFooter />

      {modalOpen && (
        <SignupModal onClose={() => setModalOpen(false)} utm={utm} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="relative px-6 pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(700px circle at 20% 20%, rgba(0,255,136,0.12), transparent 55%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-block text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors mb-10"
        >
          ← Leapify
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <div className="inline-block bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
              Hunter · Free to join
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.025em] leading-[1.05] mb-6">
              turn 30 minutes a day into{" "}
              <span className="text-[#00ff88]">$500–$1,500 a week.</span>
            </h1>
            <p className="text-base md:text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
              Free to join. 30% commission on every closed deal. Real payouts.
              No cold dialing, no quota, no boss. We give you the network, the
              vendors, and the pitch — you just make the intros.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={onCTA}
                className="bg-[#00ff88] hover:bg-[#00e67a] text-black px-7 py-4 rounded-full font-semibold text-base transition-all shadow-[0_8px_32px_-8px_rgba(0,255,136,0.4)]"
              >
                start hunting — free
              </button>
              <a
                href="#how-it-works"
                className="text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                see how it works ↓
              </a>
            </div>
          </div>

          {/* Platform preview — placeholder */}
          <div className="relative">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                <div className="ml-3 text-[10px] text-white/40 font-mono">
                  leapify.xyz/app/hunt
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="bg-white/5 rounded-lg px-3 py-2.5 text-xs text-white/70 flex items-center gap-2">
                  <span className="text-[#00ff88]">🔍</span>
                  <span>CFOs at Series A SaaS · 51-200 employees</span>
                </div>
                {[
                  { name: "Sarah Chen", title: "CFO @ Linear Systems", tag: "warp · $300" },
                  { name: "Marcus Ruiz", title: "Head of Finance @ Candle", tag: "deel · $450" },
                  { name: "Priya Patel", title: "VP Finance @ Basecamp AI", tag: "rho · $225" },
                  { name: "Jordan Kim", title: "CFO @ Stripe-backed fintech", tag: "slash · $225" },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-white/50 truncate">
                        {p.title}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-[#00ff88] shrink-0">
                      {p.tag}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[10px] text-center text-white/40 font-mono">
                search 10,000+ verified B2B leads
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// PITCH
// ─────────────────────────────────────────────────────────────
function Pitch() {
  return (
    <section className="px-6 py-20 md:py-28 border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-2xl md:text-4xl font-semibold tracking-[-0.02em] leading-[1.25]">
          most tools charge you to find cold leads.{" "}
          <span className="text-[#00ff88]">
            leapify pays you to close warm ones.
          </span>
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FEATURES
// ─────────────────────────────────────────────────────────────
function Features() {
  const items = [
    {
      icon: "💰",
      title: "30% commission on every close",
      body:
        "Payouts range from $135 to $1,125 per intro, paid within 30 days.",
    },
    {
      icon: "🎯",
      title: "Refer from your own network",
      body:
        "Know the right people? Submit them directly — no paywall, no quotas, no hoops.",
    },
    {
      icon: "✍️",
      title: "Pitch templates for every vendor",
      body:
        "LinkedIn DMs, cold emails, follow-up sequences. Pre-written. Just personalize and send.",
    },
    {
      icon: "🔥",
      title: "Weekly hot list",
      body:
        "Vendors actively looking for specific lead profiles. Hunt against the list, close faster.",
    },
    {
      icon: "🗂",
      title: "Optional lead database upgrade",
      body:
        "Don't have a network? Unlock the 10,000+ B2B lead database for a small monthly fee — only if you need it.",
    },
    {
      icon: "🚫",
      title: "No cap, no quota, no boss",
      body:
        "Zero fixed costs to get started. The ceiling is whatever you can close.",
    },
  ];

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-[#00ff88] font-semibold mb-4">
            What you get — free to join
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.02em]">
            Everything you need to hunt.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => (
            <div
              key={it.title}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
            >
              <div className="text-3xl mb-4">{it.icon}</div>
              <h3 className="text-lg font-semibold mb-2.5 tracking-tight">
                {it.title}
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "01", title: "Join free", body: "60-second signup. No card required." },
    { n: "02", title: "Hunt leads in the platform", body: "Search, qualify, and pitch using our templates." },
    { n: "03", title: "Submit intros, get paid", body: "We qualify, we close, you earn 30%." },
  ];

  return (
    <section id="how-it-works" className="px-6 py-20 md:py-24 bg-white/[0.02] border-y border-white/10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-[#00ff88] font-semibold mb-4">
            How it works
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.02em]">
            Three steps. No cold dialing.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
              <div className="text-[#00ff88] font-mono text-sm tracking-wider mb-5">
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

// ─────────────────────────────────────────────────────────────
// CALCULATOR
// ─────────────────────────────────────────────────────────────
const CAT_PAYOUTS = {
  finance: 225,
  payroll: 300,
  ecom: 200,
};

function Calculator({ onCTA }: { onCTA: () => void }) {
  const [finance, setFinance] = useState(2);
  const [payroll, setPayroll] = useState(1);
  const [ecom, setEcom] = useState(2);

  const total =
    finance * CAT_PAYOUTS.finance +
    payroll * CAT_PAYOUTS.payroll +
    ecom * CAT_PAYOUTS.ecom;

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-[#00ff88] font-semibold mb-4">
            Payout calculator
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.02em]">
            Do the math on your month.
          </h2>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-10">
          <div className="space-y-8">
            <Slider
              label="Finance / Banking intros closed"
              value={finance}
              onChange={setFinance}
              payout={CAT_PAYOUTS.finance}
            />
            <Slider
              label="Payroll / HR intros closed"
              value={payroll}
              onChange={setPayroll}
              payout={CAT_PAYOUTS.payroll}
            />
            <Slider
              label="Ecommerce / Logistics intros closed"
              value={ecom}
              onChange={setEcom}
              payout={CAT_PAYOUTS.ecom}
            />
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <div className="text-sm text-white/50 mb-2">
              You&apos;d earn this month:
            </div>
            <div className="text-5xl md:text-7xl font-bold text-[#00ff88] tracking-tight tabular-nums mb-3">
              ${total.toLocaleString()}
            </div>
            <p className="text-xs text-white/40 max-w-md mx-auto leading-relaxed">
              Averages based on our active vendor network. Actual payouts vary
              by vendor and deal size.
            </p>
            <button
              onClick={onCTA}
              className="mt-8 bg-[#00ff88] hover:bg-[#00e67a] text-black px-7 py-3 rounded-full font-semibold text-sm transition-all"
            >
              start hunting — free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  onChange,
  payout,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  payout: number;
}) {
  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-white/40 mt-0.5">
            ${payout} per close
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums text-white">{value}</div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hunter-slider w-full"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 font-mono">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
      <style jsx>{`
        .hunter-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          outline: none;
        }
        .hunter-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #00ff88;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(0, 255, 136, 0.15);
        }
        .hunter-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #00ff88;
          border: 0;
          cursor: pointer;
          box-shadow: 0 0 0 4px rgba(0, 255, 136, 0.15);
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GUARANTEE
// ─────────────────────────────────────────────────────────────
function Guarantee() {
  return (
    <section className="px-6 py-20 md:py-24 bg-[#00ff88]/5 border-y border-[#00ff88]/30">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-block bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
          How you get paid
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.1] mb-6">
          Every closed deal.{" "}
          <span className="text-[#00ff88]">Paid in 30 days.</span>
        </h2>
        <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
          You submit an intro. We close the deal. The vendor pays us.
          Within 30 days of that payment, you get 30% — direct deposit,
          no chasing, no invoicing.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────
function Testimonials() {
  const items = [
    {
      quote:
        "laid off from my SDR role in march. joined hunter in april, made $3,400 in my first month closing payroll and banking intros. zero cost to get in, 30% of every close.",
      name: "Marcus T.",
      role: "Former SDR",
      initials: "MT",
    },
    {
      quote:
        "i was already running a freelance recruiting side hustle. hunter gave me 3 new revenue lanes and a lead database better than apollo. paid for itself in week one.",
      name: "Sarah K.",
      role: "Independent recruiter",
      initials: "SK",
    },
    {
      quote:
        "stay-at-home parent. 20 years in enterprise sales before i left the workforce. hunter lets me work 2 hours a day around my kids and pull $1,500/month consistent.",
      name: "Jenn M.",
      role: "Parent + closer",
      initials: "JM",
    },
  ];

  return (
    <section className="px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-[#00ff88] font-semibold mb-4">
            Hunters in the wild
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.02em]">
            Real people. Real checks.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {items.map((t) => (
            <div
              key={t.name}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-7"
            >
              <p className="text-sm md:text-base text-white/85 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-semibold text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-white/50">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────
function FAQ() {
  const items = [
    {
      q: "Is Hunter really free?",
      a: "Yes. Signup is free, referring leads from your network is free, and you earn 30% on every closed deal. You only pay if you want to use our premium lead database (an optional in-app upgrade).",
    },
    {
      q: "Do I need sales experience?",
      a: "Helpful but not required. We give you pitch templates and coaching.",
    },
    {
      q: "How do payouts work?",
      a: "You earn 30% of what the vendor pays us. Paid within 30 days of the deal closing via direct deposit.",
    },
    {
      q: "What if I don't know anyone in the vendor's ICP?",
      a: "Most people know more than they think — start with LinkedIn connections. If you want to hunt beyond your network, upgrade to the lead database inside the app.",
    },
    {
      q: "Is there a cap on earnings?",
      a: "No. The more you close, the more you earn. No quotas either.",
    },
    {
      q: "How is this different from AngelList/Superconnector/etc?",
      a: "We hand-vet every vendor, pre-write your pitches, and pay faster. You own the relationship, we handle the deal mechanics.",
    },
  ];

  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="px-6 py-20 md:py-28 bg-white/[0.02] border-y border-white/10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-[#00ff88] font-semibold mb-4">
            FAQ
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.02em]">
            Everything else.
          </h2>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm md:text-base font-medium text-white">
                  {item.q}
                </span>
                <span className={`text-[#00ff88] text-xl shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-white/70 leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FINAL CTA
// ─────────────────────────────────────────────────────────────
function FinalCTA({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="relative px-6 py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px circle at 50% 50%, rgba(0,255,136,0.15), transparent 60%)",
        }}
      />
      <div className="relative max-w-2xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.025em] leading-[1.05] mb-5">
          Free to join.{" "}
          <span className="text-[#00ff88]">30% of every close.</span>
          <br />
          Unlimited upside.
        </h2>
        <p className="text-base md:text-lg text-white/70 mb-10">
          60-second signup. No card. No quota. No boss.
        </p>
        <button
          onClick={onCTA}
          className="bg-[#00ff88] hover:bg-[#00e67a] text-black px-9 py-4 rounded-full font-semibold text-base md:text-lg transition-all shadow-[0_8px_32px_-8px_rgba(0,255,136,0.5)]"
        >
          start hunting — free
        </button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function HunterFooter() {
  return (
    <footer className="px-6 py-10 border-t border-white/10 text-center">
      <div className="max-w-6xl mx-auto text-xs text-white/40">
        <Link href="/" className="hover:text-white/70 transition-colors">
          Leapify
        </Link>
        <span className="mx-3">·</span>
        <Link href="/referral_connector.html" className="hover:text-white/70 transition-colors">
          Free referral tier
        </Link>
        <span className="mx-3">·</span>
        <Link href="/about" className="hover:text-white/70 transition-colors">
          About
        </Link>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
// SIGNUP MODAL
// ─────────────────────────────────────────────────────────────
function SignupModal({
  onClose,
  utm,
}: {
  onClose: () => void;
  utm: UTMBundle;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    linkedin: "",
    phone: "",
    background: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function goNext() {
    if (step === 1) {
      if (!form.name.trim()) return setError("Full name required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return setError("Valid email required.");
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (!form.background) return setError("Pick an option.");
      setError(null);
      setStep(3);
    }
  }

  function goBack() {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", form.name);
      fd.set("email", form.email);
      fd.set("linkedin", form.linkedin);
      fd.set("phone", form.phone);
      fd.set("background", form.background);
      if (utm.utm_source) fd.set("utm_source", utm.utm_source);
      if (utm.utm_medium) fd.set("utm_medium", utm.utm_medium);
      if (utm.utm_campaign) fd.set("utm_campaign", utm.utm_campaign);
      if (utm.utm_content) fd.set("utm_content", utm.utm_content);
      if (utm.utm_term) fd.set("utm_term", utm.utm_term);
      if (utm.referrer) fd.set("referrer", utm.referrer);

      const res = await submitHunterSignupAction(fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      // Fire Google Ads conversion before showing success screen
      const [firstName, ...rest] = form.name.trim().split(/\s+/);
      trackHunterSignup({
        signupId: res.id,
        email: form.email,
        firstName,
        lastName: rest.join(" ") || undefined,
        value: 49,
      });
      setSuccess(true);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0a0a0a] border border-white/15 rounded-2xl w-full max-w-md p-6 md:p-8 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          ×
        </button>

        {success ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/40 mb-5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12L10 17L19 7"
                  stroke="#00ff88"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-3">
              Welcome to the hunt.
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Check your email for platform access and the Stripe checkout link
              within 10 minutes.
            </p>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left mb-6">
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-white/10">
                  <Image
                    src="/images/greg-bessoni.jpg"
                    alt="Greg Bessoni"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold">Greg Bessoni</div>
                  <div className="text-xs text-white/50">
                    Leapify · gbessoni07@gmail.com
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/70 italic leading-relaxed mt-3">
                &ldquo;Looking forward to seeing what you close. I&apos;m
                watching the leaderboard — first check usually lands within 2-3
                weeks.&rdquo;
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-1 rounded-full flex-1 transition-all ${
                    step === n
                      ? "bg-[#00ff88]"
                      : step > n
                      ? "bg-[#00ff88]/50"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-semibold mb-2">
                Step {step} of 3
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                {step === 1 && "Your info."}
                {step === 2 && "Your background."}
                {step === 3 && "Confirm & start hunting."}
              </h3>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Full name"
                  value={form.name}
                  onChange={(v) => update("name", v)}
                  autoFocus
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                />
                <Input
                  label="LinkedIn URL"
                  type="url"
                  value={form.linkedin}
                  onChange={(v) => update("linkedin", v)}
                  placeholder="https://linkedin.com/in/..."
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/60 mb-2 font-semibold">
                  I am a...
                </label>
                <div className="space-y-2">
                  {[
                    "Former SDR/BDR",
                    "Freelance recruiter",
                    "Laid-off sales exec",
                    "Side hustler / general",
                    "Other",
                  ].map((opt) => (
                    <label
                      key={opt}
                      className={`block cursor-pointer px-4 py-3 rounded-lg border transition-colors ${
                        form.background === opt
                          ? "bg-[#00ff88]/10 border-[#00ff88]"
                          : "bg-white/[0.02] border-white/10 hover:border-white/25"
                      }`}
                    >
                      <input
                        type="radio"
                        name="background"
                        value={opt}
                        checked={form.background === opt}
                        onChange={() => update("background", opt)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-4">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-sm text-white/60">Hunter access</span>
                    <span className="text-2xl font-bold text-[#00ff88] tabular-nums">
                      Free
                    </span>
                  </div>
                  <ul className="text-xs text-white/70 space-y-1.5">
                    <li>✓ Refer leads from your own network, free forever</li>
                    <li>✓ 30% commission on every closed deal</li>
                    <li>✓ Pitch templates + weekly hot list</li>
                    <li>✓ No card required, no quota, no boss</li>
                  </ul>
                </div>
                <p className="text-xs text-white/50 text-center mb-4">
                  We&apos;ll email you login details within 10 minutes. Sign in
                  and start submitting intros.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={pending}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={pending}
                  className="bg-[#00ff88] hover:bg-[#00e67a] text-black px-5 py-2.5 rounded-full font-semibold text-sm transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pending}
                  className="bg-[#00ff88] hover:bg-[#00e67a] text-black px-5 py-2.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {pending ? "Submitting..." : "Complete signup →"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/60 mb-2 font-semibold">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-white/[0.02] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00ff88] focus:ring-2 focus:ring-[#00ff88]/20 transition-colors"
      />
    </div>
  );
}
