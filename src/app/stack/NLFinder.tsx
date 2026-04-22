"use client";

import { useState, useTransition } from "react";
import { submitStackLeadNLAction, type MatchedVendor } from "./actions";
import type { UTMBundle } from "./StackExperience";
import { trackStackLead, getFbp } from "@/lib/track";

const EXAMPLES = [
  "20-person B2B SaaS, Series A, need banking + payroll + sales tax",
  "$5M ecommerce apparel brand, outgrowing 3PL, need better fulfillment",
  "Solo founder pre-seed, just raised $500K, Delaware C-corp",
  "$10M CPG food brand selling to Target and Whole Foods",
];

export function NLFinder({
  utm,
  onSuccess,
}: {
  utm?: UTMBundle;
  onSuccess: (
    leadId: number,
    email: string,
    matches: MatchedVendor[]
  ) => void;
}) {
  const [nlQuery, setNlQuery] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    linkedin: "",
    company: "",
    title: "",
    website: "",
    revenue: "",
    employees: "",
    industry: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (nlQuery.trim().length < 15) {
      return setError("Tell us a bit more about what you're looking for.");
    }
    if (!form.name.trim()) return setError("Your full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Valid email required.");
    if (!form.company.trim()) return setError("Company name is required.");

    startTransition(async () => {
      const fd = new FormData();
      fd.set("nl_query", nlQuery);
      Object.entries(form).forEach(([k, v]) => fd.set(k, v));
      // Forward UTM attribution + click IDs
      if (utm) {
        if (utm.utm_source) fd.set("utm_source", utm.utm_source);
        if (utm.utm_medium) fd.set("utm_medium", utm.utm_medium);
        const campaign = utm.utm_campaign || utm.campaign;
        if (campaign) fd.set("utm_campaign", campaign);
        if (utm.utm_content) fd.set("utm_content", utm.utm_content);
        if (utm.utm_term) fd.set("utm_term", utm.utm_term);
        if (!utm.utm_source && utm.source) fd.set("utm_source", utm.source);
        if (utm.gclid) fd.set("gclid", utm.gclid);
        if (utm.fbclid) fd.set("fbclid", utm.fbclid);
        if (utm.landing_path) fd.set("landing_path", utm.landing_path);
      }
      // _fbp cookie for Meta CAPI server-side matching
      const fbp = getFbp();
      if (fbp) fd.set("fbp", fbp);
      const res = await submitStackLeadNLAction(fd);
      if ("error" in res) {
        setError(res.error);
      } else {
        const [firstName, ...rest] = form.name.trim().split(/\s+/);
        trackStackLead({
          leadId: res.lead_id,
          email: form.email,
          firstName,
          lastName: rest.join(" ") || undefined,
          value: 50,
        });
        onSuccess(res.lead_id, res.lead_email, res.matches);
      }
    });
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">
          AI-powered match
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-3">
          Tell us what you&apos;re running.
        </h2>
        <p className="text-white/60">
          We&apos;ll match you to 3 vendors from our network.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 space-y-5"
      >
        <div>
          <label className="block text-xs uppercase tracking-wider text-white/60 mb-2 font-medium">
            Describe your company + what you need{" "}
            <span className="text-[#5B4FE8]">*</span>
          </label>
          <textarea
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            rows={4}
            placeholder="e.g. 20-person B2B SaaS, Series A, US-based. We need banking, payroll, and sales tax compliance. Moving off Brex and Gusto."
            maxLength={1000}
            autoFocus
            className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5B4FE8] focus:ring-2 focus:ring-[#5B4FE8]/20 transition-colors resize-y"
          />
          <div className="text-xs text-white/40 mt-2 flex flex-wrap gap-2">
            <span className="self-center mr-1">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setNlQuery(ex)}
                disabled={pending}
                className="text-white/50 hover:text-white/90 underline underline-offset-2 decoration-dotted"
              >
                {ex.slice(0, 40)}...
              </button>
            ))}
          </div>
        </div>

        {/* Minimal contact info — kept visible, not hidden behind a step */}
        <div className="pt-5 border-t border-white/10 space-y-4">
          <div className="text-xs uppercase tracking-wider text-white/60 font-medium">
            Where to send your matches
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full name"
              required
              value={form.name}
              onChange={(v) => update("name", v)}
            />
            <Input
              label="Work email"
              type="email"
              required
              value={form.email}
              onChange={(v) => update("email", v)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company"
              required
              value={form.company}
              onChange={(v) => update("company", v)}
            />
            <Select
              label="Company size"
              value={form.employees}
              onChange={(v) => update("employees", v)}
              options={["1–10", "11–50", "51–200", "201–1000", "1000+"]}
            />
          </div>

          {/* Optional details — collapsed by default */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 decoration-dotted"
          >
            {showDetails ? "− Hide" : "+ Add"} optional details (LinkedIn, revenue, industry)
          </button>

          {showDetails && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="LinkedIn URL"
                  type="url"
                  value={form.linkedin}
                  onChange={(v) => update("linkedin", v)}
                  placeholder="https://linkedin.com/in/..."
                />
                <Input
                  label="Your title"
                  value={form.title}
                  onChange={(v) => update("title", v)}
                  placeholder="Founder, Head of Ops..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Website"
                  type="url"
                  value={form.website}
                  onChange={(v) => update("website", v)}
                />
                <Select
                  label="Revenue"
                  value={form.revenue}
                  onChange={(v) => update("revenue", v)}
                  options={[
                    "Pre-revenue",
                    "<$1M",
                    "$1M–$5M",
                    "$5M–$25M",
                    "$25M–$100M",
                    "$100M+",
                  ]}
                />
                <Select
                  label="Industry"
                  value={form.industry}
                  onChange={(v) => update("industry", v)}
                  options={[
                    "SaaS",
                    "Ecommerce",
                    "CPG",
                    "Fintech",
                    "Services",
                    "Marketplace",
                    "Healthcare",
                    "Other",
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#5B4FE8] hover:bg-[#4a3ed6] text-white px-6 py-3.5 rounded-full font-medium transition-all disabled:opacity-50 shadow-[0_8px_32px_-8px_rgba(91,79,232,0.6)]"
        >
          {pending ? "Finding your matches..." : "Get my 3 matches →"}
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-white/60 mb-2 font-medium">
        {label} {required && <span className="text-[#5B4FE8]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#5B4FE8] focus:ring-2 focus:ring-[#5B4FE8]/20 transition-colors"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-white/60 mb-2 font-medium">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B4FE8] focus:ring-2 focus:ring-[#5B4FE8]/20 transition-colors appearance-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23ffffff66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
          paddingRight: "34px",
        }}
      >
        <option value="" className="bg-[#0a0a0a]">
          Any
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0a0a0a]">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
