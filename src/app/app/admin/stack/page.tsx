import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { StackLeadRow } from "./StackLeadRow";

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

export default async function AdminStackPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const leads = await query<StackLead>(
    `SELECT id, name, email, linkedin, title, company, website, revenue, employees,
            industry, searched_vendor, problem, matched_vendors, selected_vendors,
            status, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
            created_at, updated_at
     FROM stack_leads
     ORDER BY
       CASE status
         WHEN 'meetings_selected' THEN 0
         WHEN 'submitted' THEN 1
         WHEN 'intros_sent' THEN 2
         ELSE 3
       END,
       created_at DESC`
  );

  const counts = {
    total: leads.length,
    wantingIntros: leads.filter((l) => l.status === "meetings_selected").length,
    submitted: leads.filter((l) => l.status === "submitted").length,
    introsSent: leads.filter((l) => l.status === "intros_sent").length,
  };

  // Load vendor names for display
  const allSelectedSlugs = Array.from(
    new Set(
      leads.flatMap((l) => [
        ...(l.matched_vendors || []),
        ...(l.selected_vendors || []),
      ])
    )
  );
  const vendors =
    allSelectedSlugs.length > 0
      ? await query<{ slug: string; name: string; email: string | null }>(
          `SELECT slug, name, email FROM vendors WHERE slug = ANY($1)`,
          [allSelectedSlugs]
        )
      : [];
  const vendorMap = Object.fromEntries(
    vendors.map((v) => [v.slug, { name: v.name, email: v.email }])
  );

  return (
    <AppShell user={session}>
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href="/app/admin"
            className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to Admin
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Stack leads
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Leads that came through the Stack landing page (
                <a href="https://www.leapify.xyz/stack" className="underline">
                  /stack
                </a>
                ). &quot;Wanting intros&quot; = form submitted + meetings
                selected. Reach out to them within 24 hours.
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <Stat label="Wanting intros" count={counts.wantingIntros} highlight />
              <Stat label="Submitted only" count={counts.submitted} />
              <Stat label="Intros sent" count={counts.introsSent} />
              <Stat label="Total" count={counts.total} />
            </div>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500">
              No stack leads yet. Share{" "}
              <a
                href="https://www.leapify.xyz/stack"
                className="text-indigo-600 underline"
              >
                /stack
              </a>{" "}
              to start getting them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <StackLeadRow
                key={lead.id}
                lead={lead}
                vendorMap={vendorMap}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  count,
  highlight,
}: {
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border ${
        highlight && count > 0
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-white border-gray-200 text-gray-700"
      }`}
    >
      <div className="uppercase tracking-wider font-medium text-[10px]">
        {label}
      </div>
      <div className="font-semibold text-base">{count}</div>
    </div>
  );
}
