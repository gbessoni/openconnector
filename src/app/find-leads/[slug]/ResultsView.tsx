"use client";

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
  results,
  totalCount,
}: {
  slug: string;
  queryLabel: string;
  results: Prospect[];
  totalCount: number;
}) {
  function downloadCSV() {
    if (results.length === 0) return;
    const rows = results.map((p) => ({
      name: p.full_name || "",
      title: p.job_title || "",
      company: p.job_company_name || "",
      company_size: p.job_company_size || "",
      industry: p.industry || "",
      location: p.location_name || "",
      linkedin_url: p.linkedin_url || "",
    }));
    const header = Object.keys(rows[0]);
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map(
            (k) =>
              `"${String((r as Record<string, string>)[k]).replace(/"/g, '""')}"`
          )
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

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">{totalCount}</span> prospects
        </div>
        <button
          onClick={downloadCSV}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ⬇ Download CSV
        </button>
      </div>

      <div className="space-y-3">
        {results.map((p, i) => (
          <ProspectCard key={p.pdl_id || i} prospect={p} />
        ))}
      </div>
    </div>
  );
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const linkedinHref = prospect.linkedin_url
    ? prospect.linkedin_url.startsWith("http")
      ? prospect.linkedin_url
      : `https://${prospect.linkedin_url}`
    : null;

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
            {prospect.job_company_size && (
              <span>👥 {prospect.job_company_size}</span>
            )}
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
