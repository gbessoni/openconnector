"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVendorAction } from "../../../actions";
import type { Vendor } from "@/lib/leads";

export function VendorEditForm({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSavedMsg(null);
    formData.set("id", String(vendor.id));
    const res = await updateVendorAction(formData);
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSavedMsg("Saved.");
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Section title="Basics">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" name="name" defaultValue={vendor.name} required />
          <Field
            label="Category"
            name="category"
            defaultValue={vendor.category || ""}
          />
        </div>
        <Field
          label="Target Industries (comma-separated)"
          name="target_industries"
          defaultValue={vendor.target_industries || ""}
        />
        <Field
          label="Short description (one-liner)"
          name="description"
          defaultValue={vendor.description || ""}
        />
        <Textarea
          label="Long description"
          name="long_description"
          rows={6}
          defaultValue={vendor.long_description || ""}
          placeholder="Deeper positioning, core benefits, what wins..."
        />
      </Section>

      <Section title="Ideal Customer Profile">
        <Textarea
          label="ICP summary (prose)"
          name="icp"
          rows={4}
          defaultValue={vendor.icp || ""}
          placeholder="If your audience includes finance and operations leaders..."
        />
        <Textarea
          label="ICP bullets (one per line)"
          name="icp_bullets"
          rows={5}
          defaultValue={vendor.icp_bullets || ""}
          placeholder={
            "B2B services businesses (sales-led, contract-driven)\nRevenue range: $5M–$50M+\nTypically 10–200 employees"
          }
        />
        <Textarea
          label="Primary buyer titles (one per line)"
          name="primary_buyer"
          rows={4}
          defaultValue={vendor.primary_buyer || ""}
          placeholder={"Founder / CEO\nHead of Finance / Fractional CFO\nHead of Operations"}
        />
      </Section>

      <Section title="Economics (admin only)">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Qualified lead payout (text)"
            name="payout_text"
            defaultValue={vendor.payout_text || ""}
            placeholder="$375 or Up to $1,500"
          />
          <Field
            label="Payout amount (numeric)"
            name="payout_amount"
            type="number"
            step="0.01"
            defaultValue={
              vendor.payout_amount != null ? String(vendor.payout_amount) : ""
            }
          />
        </div>
        <Field
          label="Commission"
          name="commission_text"
          defaultValue={vendor.commission_text || ""}
        />
        <Textarea
          label="Commission notes"
          name="commission_notes"
          rows={3}
          defaultValue={vendor.commission_notes || ""}
          placeholder="Commission varies depending on company revenue."
        />
      </Section>

      <Section title="Contact">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Vendor email (admin only)"
            name="email"
            type="email"
            defaultValue={vendor.email || ""}
          />
          <Field
            label="Website"
            name="website"
            defaultValue={vendor.website || ""}
            placeholder="example.com"
          />
        </div>
        <Field
          label="Country"
          name="country"
          defaultValue={vendor.country || ""}
          placeholder="United States"
        />
      </Section>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {savedMsg && (
        <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {savedMsg}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Save changes"}
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
  defaultValue,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  step?: string;
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
        defaultValue={defaultValue}
        step={step}
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
  defaultValue,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
      />
    </div>
  );
}
