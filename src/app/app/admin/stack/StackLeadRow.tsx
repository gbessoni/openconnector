"use client";

import { useState, useTransition } from "react";
import { markIntrosSentAction } from "./actions";

interface StackLead {
  id: number;
  name: string;
  email: string;
  linkedin: string | null;
  title: string | null;
  company: string;
  website: string | null;
  revenue: string | null;
  employees: string | null;
  industry: string | null;
  searched_vendor: string;
  problem: string;
  matched_vendors: string[];
  selected_vendors: string[] | null;
  status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
  updated_at: string;
}

interface VendorInfo {
  name: string;
  email: string | null;
}

export function StackLeadRow({
  lead,
  vendorMap,
}: {
  lead: StackLead;
  vendorMap: Record<string, VendorInfo>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(lead.status);
  const [pending, startTransition] = useTransition();

  const selected = lead.selected_vendors || [];
  const matched = lead.matched_vendors || [];

  const statusColors: Record<string, string> = {
    submitted: "bg-gray-100 text-gray-700",
    meetings_selected: "bg-amber-100 text-amber-900",
    intros_sent: "bg-green-100 text-green-800",
  };

  function handleMarkIntrosSent() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lead_id", String(lead.id));
      const res = await markIntrosSentAction(fd);
      if (!("error" in res)) {
        setStatus("intros_sent");
      }
    });
  }

  const linkedinHref = lead.linkedin
    ? lead.linkedin.startsWith("http")
      ? lead.linkedin
      : `https://${lead.linkedin}`
    : null;

  const websiteHref = lead.website
    ? lead.website.startsWith("http")
      ? lead.website
      : `https://${lead.website}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
              {lead.title && (
                <span className="text-xs text-gray-500">· {lead.title}</span>
              )}
              <span className="text-xs text-gray-500">@ {lead.company}</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  statusColors[status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {status.replace("_", " ")}
              </span>
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap">
              <a
                href={`mailto:${lead.email}`}
                className="text-indigo-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.email}
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
              {websiteHref && (
                <>
                  <span className="text-gray-300">·</span>
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Website
                  </a>
                </>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Searched: <strong className="text-gray-600">{lead.searched_vendor}</strong> ·{" "}
              {selected.length > 0
                ? `Wants ${selected.length} intro(s)`
                : "No selections yet"}{" "}
              · {new Date(lead.created_at).toLocaleDateString()}
              {lead.utm_source && (
                <>
                  {" · "}
                  <span className="font-medium text-indigo-600">
                    {lead.utm_source}
                    {lead.utm_campaign && ` / ${lead.utm_campaign}`}
                  </span>
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
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
                Company
              </h4>
              <dl className="text-sm space-y-1">
                {lead.revenue && (
                  <div className="flex">
                    <dt className="w-24 text-gray-500">Revenue</dt>
                    <dd className="text-gray-900">{lead.revenue}</dd>
                  </div>
                )}
                {lead.employees && (
                  <div className="flex">
                    <dt className="w-24 text-gray-500">Employees</dt>
                    <dd className="text-gray-900">{lead.employees}</dd>
                  </div>
                )}
                {lead.industry && (
                  <div className="flex">
                    <dt className="w-24 text-gray-500">Industry</dt>
                    <dd className="text-gray-900">{lead.industry}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
                Problem
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {lead.problem}
              </p>
            </div>
          </div>

          {selected.length > 0 ? (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-green-800 mb-2">
                ✓ Wants intros to ({selected.length})
              </h4>
              <ul className="text-sm space-y-1">
                {selected.map((slug) => {
                  const v = vendorMap[slug];
                  return (
                    <li key={slug} className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {v?.name || slug}
                      </span>
                      {v?.email && (
                        <>
                          <span className="text-gray-300">·</span>
                          <a
                            href={`mailto:${v.email}`}
                            className="text-indigo-600 hover:underline text-xs"
                          >
                            {v.email}
                          </a>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : matched.length > 0 ? (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
                AI matched (not yet selected)
              </h4>
              <ul className="text-sm space-y-1">
                {matched.map((slug) => {
                  const v = vendorMap[slug];
                  return (
                    <li key={slug} className="text-gray-600">
                      {v?.name || slug}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {status === "meetings_selected" && (
            <div className="mt-5 pt-4 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={handleMarkIntrosSent}
                disabled={pending}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {pending ? "..." : "✓ Mark intros sent"}
              </button>
              <span className="text-xs text-gray-500">
                Click after you&apos;ve emailed the calendar link
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
