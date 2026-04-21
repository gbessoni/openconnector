"use client";

import { useState, useTransition } from "react";
import { unlockLeadsAction } from "../actions";

interface Prospect {
  pdl_id: string;
  full_name: string;
  job_title: string | null;
  job_company_name: string | null;
  job_company_size: string | null;
  industry: string | null;
  linkedin_url: string | null;
  location_name: string | null;
  work_email_available?: boolean;
}

export function ResultsView({
  slug,
  queryLabel,
  visibleResults,
  blurredCount,
  totalCount,
  unlocked: initialUnlocked,
  unlockedResults,
}: {
  slug: string;
  queryLabel: string;
  visibleResults: Prospect[];
  blurredCount: number;
  totalCount: number;
  unlocked: boolean;
  unlockedResults: Prospect[];
}) {
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [email, setEmail] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "err" | "ok"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const displayUrl = `https://www.leapify.xyz/find-leads/${slug}`;

  const shareText = `Just searched "${queryLabel}" and got ${totalCount} real leads with LinkedIn URLs in 30 seconds. Free tool by @leapify → ${displayUrl}`;
  const linkedinText = `I just found ${totalCount} prospects matching my ICP ("${queryLabel}") using Leapify's free lead tool. Real LinkedIn-verified profiles, no fluff. Try it: ${displayUrl}`;

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(displayUrl)}`;

  async function confirmUnlock(method: "share_x" | "share_linkedin" | "email") {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("slug", slug);
      fd.set("method", method);
      if (method === "email") fd.set("email", email);
      const res = await unlockLeadsAction(fd);
      if (res?.error) {
        setMsg({ type: "err", text: res.error });
      } else {
        setUnlocked(true);
        setMsg({ type: "ok", text: "Unlocked — full list below." });
      }
    });
  }

  function handleShareClick(platform: "x" | "linkedin") {
    const url = platform === "x" ? xUrl : liUrl;
    window.open(url, "_blank", "width=600,height=500");
    // Surface the confirm button after share opens
  }

  function downloadCSV() {
    const rows = unlockedResults.map((p) => ({
      name: p.full_name || "",
      title: p.job_title || "",
      company: p.job_company_name || "",
      company_size: p.job_company_size || "",
      industry: p.industry || "",
      location: p.location_name || "",
      linkedin_url: p.linkedin_url || "",
    }));
    const header = Object.keys(rows[0] || {});
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((k) => `"${String((r as Record<string, string>)[k]).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leapify-leads-${slug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const shownList = unlocked ? unlockedResults : visibleResults;

  return (
    <div>
      {/* Action bar when unlocked */}
      {unlocked && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">{unlockedResults.length}</span>{" "}
            prospects unlocked
          </div>
          <button
            onClick={downloadCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ⬇ Download CSV
          </button>
        </div>
      )}

      <div className="space-y-3">
        {shownList.map((p, i) => {
          const isBlurred = !unlocked && i >= 5;
          return <ProspectCard key={p.pdl_id || i} prospect={p} blurred={isBlurred} />;
        })}
      </div>

      {!unlocked && blurredCount > 0 && (
        <div className="relative -mt-16 pt-16">
          {/* The blur gate overlay */}
          <div className="bg-white rounded-xl border-2 border-accent shadow-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="inline-block text-4xl mb-3">🔒</div>
            <h3 className="font-serif text-2xl text-gray-900 mb-2">
              {blurredCount} more leads locked
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Share this tool once and unlock the full {totalCount}-person list
              plus CSV download. Takes 10 seconds.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <UnlockButton
                onClick={() => {
                  handleShareClick("x");
                }}
                onConfirm={() => confirmUnlock("share_x")}
                pending={pending}
                label="Share on X"
                icon="𝕏"
                confirmLabel="I posted — unlock"
              />
              <UnlockButton
                onClick={() => {
                  handleShareClick("linkedin");
                }}
                onConfirm={() => confirmUnlock("share_linkedin")}
                pending={pending}
                label="Share on LinkedIn"
                icon="in"
                confirmLabel="I posted — unlock"
              />
              <div>
                <button
                  type="button"
                  onClick={() => setEmailOpen(!emailOpen)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  📧 Or use email
                </button>
              </div>
            </div>

            {emailOpen && (
              <div className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={() => confirmUnlock("email")}
                  disabled={pending || !email}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Unlock
                </button>
              </div>
            )}

            {msg && (
              <div
                className={`mt-4 text-xs px-3 py-2 rounded ${
                  msg.type === "ok"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {msg.text}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              Prefer unlimited access?{" "}
              <a
                href="/referral_connector.html"
                className="text-indigo-600 hover:underline font-medium"
              >
                Become a Leapify connector
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function UnlockButton({
  onClick,
  onConfirm,
  pending,
  label,
  icon,
  confirmLabel,
}: {
  onClick: () => void;
  onConfirm: () => void;
  pending: boolean;
  label: string;
  icon: string;
  confirmLabel: string;
}) {
  const [opened, setOpened] = useState(false);

  if (!opened) {
    return (
      <button
        type="button"
        onClick={() => {
          onClick();
          setOpened(true);
        }}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span className="font-bold">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onConfirm}
      disabled={pending}
      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      {pending ? "Unlocking..." : `✓ ${confirmLabel}`}
    </button>
  );
}

function ProspectCard({
  prospect,
  blurred,
}: {
  prospect: Prospect;
  blurred: boolean;
}) {
  const linkedinHref = prospect.linkedin_url
    ? prospect.linkedin_url.startsWith("http")
      ? prospect.linkedin_url
      : `https://${prospect.linkedin_url}`
    : null;

  if (blurred) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 select-none">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0" style={{ filter: "blur(6px)" }}>
            <h3 className="font-semibold text-gray-900">
              {prospect.full_name || "Locked Prospect"}
            </h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{prospect.job_title}</span>
              {prospect.job_company_name && (
                <>
                  <span className="text-gray-400"> @ </span>
                  {prospect.job_company_name}
                </>
              )}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              {prospect.job_company_size && <span>👥 {prospect.job_company_size}</span>}
              {prospect.location_name && <span>📍 {prospect.location_name}</span>}
            </div>
          </div>
          <div className="text-xs text-gray-400 italic shrink-0">🔒 Locked</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
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
            {prospect.job_company_size && <span>👥 {prospect.job_company_size}</span>}
            {prospect.location_name && <span>📍 {prospect.location_name}</span>}
          </div>
        </div>
        {linkedinHref && (
          <a
            href={linkedinHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#0A66C2] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#084c8f] transition-colors shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
            </svg>
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
