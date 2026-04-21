"use client";

import { useState, useTransition } from "react";
import { updateHunterStatusAction, updateHunterNotesAction } from "./actions";

interface Hunter {
  id: number;
  name: string;
  email: string;
  linkedin: string | null;
  phone: string | null;
  background: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_paid_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "checkout_sent", label: "Checkout Sent" },
  { value: "paid", label: "Paid" },
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  checkout_sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  active: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-amber-100 text-amber-900",
};

export function HunterRow({ hunter }: { hunter: Hunter }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(hunter.status);
  const [notes, setNotes] = useState(hunter.admin_notes || "");
  const [notesSaved, setNotesSaved] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function changeStatus(newStatus: string) {
    const prev = status;
    setStatus(newStatus);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("hunter_id", String(hunter.id));
      fd.set("status", newStatus);
      const res = await updateHunterStatusAction(fd);
      if ("error" in res) {
        setStatus(prev);
      }
    });
  }

  function saveNotes() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("hunter_id", String(hunter.id));
      fd.set("notes", notes);
      const res = await updateHunterNotesAction(fd);
      if (!("error" in res)) {
        setNotesSaved("Saved");
        setTimeout(() => setNotesSaved(null), 1500);
      }
    });
  }

  const linkedinHref = hunter.linkedin
    ? hunter.linkedin.startsWith("http")
      ? hunter.linkedin
      : `https://${hunter.linkedin}`
    : null;

  const stripeCustomerUrl = hunter.stripe_customer_id
    ? `https://dashboard.stripe.com/customers/${hunter.stripe_customer_id}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900">{hunter.name}</h3>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {status.replace("_", " ")}
              </span>
              {hunter.cancel_at_period_end && status === "active" && (
                <span className="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-medium">
                  Cancel at period end
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap">
              <a
                href={`mailto:${hunter.email}`}
                className="text-indigo-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {hunter.email}
              </a>
              {linkedinHref && (
                <>
                  <span className="text-gray-300">·</span>
                  <a
                    href={linkedinHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A66C2] hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    LinkedIn →
                  </a>
                </>
              )}
              {hunter.background && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">{hunter.background}</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Signed up {new Date(hunter.created_at).toLocaleDateString()}
              {hunter.last_paid_at && (
                <>
                  {" · "}Last paid{" "}
                  {new Date(hunter.last_paid_at).toLocaleDateString()}
                </>
              )}
              {hunter.utm_source && (
                <>
                  {" · "}Source: {hunter.utm_source}
                  {hunter.utm_campaign && ` / ${hunter.utm_campaign}`}
                </>
              )}
            </div>
          </div>
          <span className="text-gray-400 text-xl shrink-0">
            {expanded ? "−" : "+"}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-5">
          {/* Status control */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
              Status (manual override)
            </label>
            <select
              value={status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={pending}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500 ml-3">
              Webhooks update this automatically — override only if needed.
            </span>
          </div>

          {/* Stripe + UTM grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
                Stripe
              </h4>
              <dl className="space-y-1">
                {stripeCustomerUrl && (
                  <div className="flex">
                    <dt className="w-28 text-gray-500">Customer</dt>
                    <dd>
                      <a
                        href={stripeCustomerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-mono text-xs"
                      >
                        {hunter.stripe_customer_id}
                      </a>
                    </dd>
                  </div>
                )}
                {hunter.stripe_subscription_id && (
                  <div className="flex">
                    <dt className="w-28 text-gray-500">Subscription</dt>
                    <dd className="font-mono text-xs text-gray-700">
                      {hunter.stripe_subscription_id}
                    </dd>
                  </div>
                )}
                {hunter.current_period_end && (
                  <div className="flex">
                    <dt className="w-28 text-gray-500">Renews</dt>
                    <dd className="text-gray-900">
                      {new Date(hunter.current_period_end).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {!stripeCustomerUrl && (
                  <div className="text-xs text-gray-400 italic">
                    No Stripe record yet
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
                Attribution
              </h4>
              <dl className="space-y-1">
                {hunter.utm_source && (
                  <div className="flex">
                    <dt className="w-28 text-gray-500">Source</dt>
                    <dd className="text-gray-900">{hunter.utm_source}</dd>
                  </div>
                )}
                {hunter.utm_medium && (
                  <div className="flex">
                    <dt className="w-28 text-gray-500">Medium</dt>
                    <dd className="text-gray-900">{hunter.utm_medium}</dd>
                  </div>
                )}
                {hunter.utm_campaign && (
                  <div className="flex">
                    <dt className="w-28 text-gray-500">Campaign</dt>
                    <dd className="text-gray-900">{hunter.utm_campaign}</dd>
                  </div>
                )}
                {hunter.phone && (
                  <div className="flex">
                    <dt className="w-28 text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{hunter.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
              Internal notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything relevant about this hunter..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y bg-white"
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={saveNotes}
                disabled={pending}
                className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                Save note
              </button>
              {notesSaved && (
                <span className="text-xs text-green-600">✓ {notesSaved}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
