"use client";

import { useState } from "react";
import { createLeadAction } from "../../actions";

export function NewLeadForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const res = await createLeadAction(formData);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <Section title="Lead">
        <Field label="Full name *" name="lead_name" required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" name="lead_email" type="email" />
          <Field label="LinkedIn URL" name="lead_linkedin" type="url" />
        </div>
        <Field label="Title / Role" name="title" />
      </Section>

      <Section title="Company">
        <Field label="Company name *" name="company" required />
        <Field label="Website" name="company_website" type="url" />
      </Section>

      <Section title="Match">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Vendor" name="vendor" placeholder="e.g. Rho, Ramp, Deel" />
          <Field label="Category" name="category" placeholder="e.g. Banking, HR" />
        </div>
        <Textarea
          label="Why is this a good fit?"
          name="why_fit"
          placeholder="Context on the problem they're solving, buying signal, timing..."
          rows={3}
        />
        <Textarea
          label="Notes"
          name="notes"
          placeholder="Anything else useful — relationship context, timing, etc."
          rows={3}
        />
      </Section>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Submitting..." : "Submit lead"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
      />
    </div>
  );
}
