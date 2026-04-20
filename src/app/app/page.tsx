import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "./AppShell";
import { getStatusMeta, type Lead } from "@/lib/leads";

export default async function AppHomePage() {
  const session = await getSession();
  if (!session) redirect("/app/login");

  // Connector sees own leads; admin sees own on this page too
  const leads = await query<Lead>(
    `SELECT * FROM leads WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [session.id]
  );

  // Stats
  const stats = {
    total: leads.length,
    pending: leads.filter((l) =>
      ["submitted", "pending_optin"].includes(l.status)
    ).length,
    active: leads.filter((l) =>
      ["vendor_interested", "intro_sent", "meeting_booked"].includes(l.status)
    ).length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    won: leads.filter((l) => ["closed_won", "paid"].includes(l.status)).length,
    paid: leads.filter((l) => l.status === "paid").length,
  };

  const estimatedPayout = leads
    .filter((l) => !["rejected", "cancelled"].includes(l.status))
    .reduce((sum, l) => sum + (l.estimated_payout ?? 0), 0);
  const actualPayout = leads.reduce(
    (sum, l) => sum + (l.actual_payout ?? 0),
    0
  );

  return (
    <AppShell user={session}>
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {session.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here's what's happening with your leads.
            </p>
          </div>
          <Link
            href="/app/leads/new"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Add Lead
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Stat label="Total" value={stats.total} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Active" value={stats.active} />
          <Stat label="Qualified" value={stats.qualified} />
          <Stat label="Won" value={stats.won} />
          <Stat
            label="Earned"
            value={`$${actualPayout.toLocaleString()}`}
            sub={`Est. $${estimatedPayout.toLocaleString()}`}
          />
        </div>

        {/* Leads table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your Leads</h2>
            <span className="text-xs text-gray-500">
              {leads.length} total
            </span>
          </div>

          {leads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm mb-4">
                No leads yet. Add your first one to get started.
              </p>
              <Link
                href="/app/leads/new"
                className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                + Add your first lead
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Lead</th>
                  <th className="text-left px-6 py-3 font-medium">Company</th>
                  <th className="text-left px-6 py-3 font-medium">Vendor</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const status = getStatusMeta(lead.status);
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <Link
                          href={`/app/leads/${lead.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {lead.lead_name}
                        </Link>
                        {lead.title && (
                          <div className="text-xs text-gray-500">{lead.title}</div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{lead.company}</td>
                      <td className="px-6 py-3 text-gray-700">
                        {lead.vendor || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
        {label}
      </div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
