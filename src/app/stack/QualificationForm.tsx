"use client";

import { useState, useTransition } from "react";
import { submitStackLeadAction, type MatchedVendor } from "./actions";

interface FormState {
  name: string;
  email: string;
  linkedin: string;
  company: string;
  title: string;
  website: string;
  revenue: string;
  employees: string;
  industry: string;
  searched_vendor: string;
  problem: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  linkedin: "",
  company: "",
  title: "",
  website: "",
  revenue: "",
  employees: "",
  industry: "",
  searched_vendor: "",
  problem: "",
};

const REVENUE_OPTIONS = [
  "Pre-revenue",
  "<$1M",
  "$1M–$5M",
  "$5M–$25M",
  "$25M–$100M",
  "$100M+",
];

const EMPLOYEE_OPTIONS = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

const INDUSTRY_OPTIONS = [
  "SaaS",
  "Ecommerce",
  "CPG",
  "Fintech",
  "Services",
  "Marketplace",
  "Healthcare",
  "Other",
];

export function QualificationForm({
  prefilledVendor,
  onSuccess,
}: {
  prefilledVendor?: string;
  onSuccess: (leadId: number, email: string, matches: MatchedVendor[]) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    searched_vendor: prefilledVendor || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(s: 1 | 2 | 3): string | null {
    if (s === 1) {
      if (!form.name.trim()) return "Your full name is required.";
      if (!form.email.trim()) return "Work email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return "Enter a valid email address.";
      if (!form.company.trim()) return "Company name is required.";
    }
    if (s === 2) {
      if (!form.revenue) return "Select your revenue range.";
      if (!form.employees) return "Select employee count.";
      if (!form.industry) return "Select an industry.";
    }
    if (s === 3) {
      if (!form.searched_vendor.trim())
        return "Which vendor were you searching for?";
      if (!form.problem.trim() || form.problem.trim().length < 10)
        return "Add a sentence or two about what problem you're solving.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => (s === 1 ? 2 : 3));
  }

  function back() {
    setError(null);
    setStep((s) => (s === 3 ? 2 : 1));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep(3);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const res = await submitStackLeadAction(fd);
      if ("error" in res) {
        setError(res.error);
      } else {
        onSuccess(res.lead_id, res.lead_email, res.matches);
      }
    });
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3].map((n) => {
          const active = step === n;
          const complete = step > n;
          return (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                active
                  ? "w-12 bg-[#5B4FE8]"
                  : complete
                  ? "w-8 bg-[#5B4FE8]/60"
                  : "w-8 bg-white/10"
              }`}
            />
          );
        })}
      </div>

      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-white/50 mb-3">
          Step {step} of 3
        </div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
          {step === 1 && "Let's start with you."}
          {step === 2 && "Tell us about your company."}
          {step === 3 && "What are you looking for?"}
        </h2>
      </div>

      <form
        onSubmit={submit}
        className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8 space-y-5"
      >
        {step === 1 && (
          <>
            <Field
              label="Full name"
              required
              value={form.name}
              onChange={(v) => update("name", v)}
              autoFocus
            />
            <Field
              label="Work email"
              type="email"
              required
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Field
              label="LinkedIn URL"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={form.linkedin}
              onChange={(v) => update("linkedin", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Company name"
                required
                value={form.company}
                onChange={(v) => update("company", v)}
              />
              <Field
                label="Your role / title"
                placeholder="Founder, Head of Ops..."
                value={form.title}
                onChange={(v) => update("title", v)}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field
              label="Company website"
              type="url"
              placeholder="https://..."
              value={form.website}
              onChange={(v) => update("website", v)}
            />
            <Select
              label="Annual revenue"
              required
              value={form.revenue}
              onChange={(v) => update("revenue", v)}
              options={REVENUE_OPTIONS}
              placeholder="Select revenue range..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Employees"
                required
                value={form.employees}
                onChange={(v) => update("employees", v)}
                options={EMPLOYEE_OPTIONS}
                placeholder="Select..."
              />
              <Select
                label="Industry"
                required
                value={form.industry}
                onChange={(v) => update("industry", v)}
                options={INDUSTRY_OPTIONS}
                placeholder="Select..."
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Field
              label="Which vendor were you searching for?"
              required
              placeholder="e.g. Rippling, Gorgias, Carta..."
              value={form.searched_vendor}
              onChange={(v) => update("searched_vendor", v)}
              autoFocus
            />
            <Textarea
              label="What problem are you trying to solve?"
              required
              rows={4}
              placeholder="A few sentences on what's broken or what you need better..."
              value={form.problem}
              onChange={(v) => update("problem", v)}
              hint={`${form.problem.length} / 600`}
              maxLength={600}
            />
          </>
        )}

        {error && (
          <div className="text-sm text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              disabled={pending}
              className="text-white/50 hover:text-white/90 text-sm transition-colors disabled:opacity-40"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              disabled={pending}
              className="inline-flex items-center gap-2 bg-[#5B4FE8] hover:bg-[#4a3ed6] text-white px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50"
            >
              Next
              <span>→</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 bg-[#5B4FE8] hover:bg-[#4a3ed6] text-white px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50 shadow-[0_8px_32px_-8px_rgba(91,79,232,0.6)]"
            >
              {pending ? "Finding your matches..." : "Get my 3 matches"}
              <span>→</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
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
        autoFocus={autoFocus}
        className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5B4FE8] focus:ring-2 focus:ring-[#5B4FE8]/20 transition-colors"
      />
    </div>
  );
}

function Textarea({
  label,
  required,
  rows = 3,
  placeholder,
  value,
  onChange,
  hint,
  maxLength,
}: {
  label: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs uppercase tracking-wider text-white/60 font-medium">
          {label} {required && <span className="text-[#5B4FE8]">*</span>}
        </label>
        {hint && <span className="text-xs text-white/40">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5B4FE8] focus:ring-2 focus:ring-[#5B4FE8]/20 transition-colors resize-y"
      />
    </div>
  );
}

function Select({
  label,
  required,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-white/60 mb-2 font-medium">
        {label} {required && <span className="text-[#5B4FE8]">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-[#0a0a0a] border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#5B4FE8] focus:ring-2 focus:ring-[#5B4FE8]/20 transition-colors appearance-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23ffffff66' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: "40px",
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0a0a0a]">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
