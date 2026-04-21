"use client";

import { useState, useTransition } from "react";
import { updateProspectStatusAction } from "../../../../actions";

interface ProspectWithPitch {
  id: number;
  pdl_id: string;
  full_name: string;
  job_title: string | null;
  job_company_name: string | null;
  job_company_size: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  location_name: string | null;
  work_email_available: boolean;
  status: string;
  contacted_at: string | null;
  replied_at: string | null;
  pitch: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-gray-100 text-gray-700" },
  { value: "queued", label: "Queued", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", color: "bg-indigo-100 text-indigo-800" },
  { value: "replied", label: "Replied", color: "bg-purple-100 text-purple-800" },
  { value: "converted", label: "Converted", color: "bg-green-100 text-green-800" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-800" },
];

export function ProspectsList({ prospects }: { prospects: ProspectWithPitch[] }) {
  const [filter, setFilter] = useState<string>("all");
  const visible =
    filter === "all" ? prospects : prospects.filter((p) => p.status === filter);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All ({prospects.length})
        </FilterChip>
        {STATUS_OPTIONS.map((s) => {
          const count = prospects.filter((p) => p.status === s.value).length;
          if (count === 0) return null;
          return (
            <FilterChip
              key={s.value}
              active={filter === s.value}
              onClick={() => setFilter(s.value)}
            >
              {s.label} ({count})
            </FilterChip>
          );
        })}
      </div>

      <div className="space-y-3">
        {visible.map((p) => (
          <ProspectCard key={p.id} prospect={p} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function ProspectCard({ prospect }: { prospect: ProspectWithPitch }) {
  const [status, setStatus] = useState(prospect.status);
  const [copied, setCopied] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [pending, startTransition] = useTransition();

  const linkedinHref = prospect.linkedin_url
    ? prospect.linkedin_url.startsWith("http")
      ? prospect.linkedin_url
      : `https://${prospect.linkedin_url}`
    : null;

  function copy() {
    navigator.clipboard.writeText(prospect.pitch).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function changeStatus(newStatus: string) {
    const prev = status;
    setStatus(newStatus);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(prospect.id));
      fd.set("status", newStatus);
      const res = await updateProspectStatusAction(fd);
      if (res?.error) setStatus(prev);
    });
  }

  const statusMeta =
    STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{prospect.full_name}</h3>
          <p className="text-sm text-gray-600">
            {prospect.job_title && (
              <span className="font-medium">{prospect.job_title}</span>
            )}
            {prospect.job_company_name && (
              <>
                {prospect.job_title && <span className="text-gray-400"> @ </span>}
                {prospect.job_company_name}
              </>
            )}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {prospect.job_company_size && (
              <span>👥 {prospect.job_company_size}</span>
            )}
            {prospect.location_name && <span>📍 {prospect.location_name}</span>}
            {prospect.work_email_available && (
              <span className="text-green-700">📧 email in PDL</span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 shrink-0">
          <select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={pending}
            className={`text-xs font-medium rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900 ${statusMeta.color}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {linkedinHref && (
          <a
            href={linkedinHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => changeStatus("contacted")}
            className="inline-flex items-center gap-1.5 bg-[#0A66C2] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#084c8f] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
            </svg>
            Open LinkedIn
          </a>
        )}
        <button
          onClick={copy}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            copied
              ? "bg-green-600 text-white"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {copied ? "✓ Copied" : "📋 Copy pitch"}
        </button>
        <button
          onClick={() => setShowPitch((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          {showPitch ? "Hide pitch" : "Show pitch"}
        </button>
      </div>

      {showPitch && (
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-4">
          {prospect.pitch}
        </pre>
      )}

      {prospect.contacted_at && (
        <div className="mt-2 text-[10px] text-gray-400">
          Contacted {new Date(prospect.contacted_at).toLocaleDateString()}
          {prospect.replied_at &&
            ` · Replied ${new Date(prospect.replied_at).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
}
