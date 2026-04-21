import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../AppShell";
import { getStatusMeta, type Lead } from "@/lib/leads";
import { CommissionRateInput } from "./CommissionRateInput";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  commission_rate: string | number;
  created_at: string;
  lead_count: number;
}

interface AdminLead extends Lead {
  owner_name: string;
  owner_email: string;
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const users = await query<UserRow>(
    `SELECT u.id, u.name, u.email, u.role, u.commission_rate, u.created_at,
            (SELECT COUNT(*) FROM leads WHERE owner_id = u.id)::int AS lead_count
     FROM users u
     ORDER BY u.created_at DESC`
  );

  const leads = await query<AdminLead>(
    `SELECT l.*, u.name AS owner_name, u.email AS owner_email
     FROM leads l JOIN users u ON u.id = l.owner_id
     ORDER BY l.created_at DESC
     LIMIT 200`
  );

  const pendingApps = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM connector_applications WHERE status = 'pending'`
  );
  const pendingAppsCount = pendingApps[0]?.count ?? 0;

  const totalPaid = leads.reduce((s, l) => s + (l.actual_payout ?? 0), 0);

  return (
    <AppShell user={session}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
            <p className="text-sm text-gray-500 mt-1">
              All connectors, all leads, all activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/admin/applications"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pendingAppsCount > 0
                  ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              📨 Applications
              {pendingAppsCount > 0 && (
                <span className="ml-2 inline-block bg-amber-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                  {pendingAppsCount}
                </span>
              )}
            </Link>
            <Link
              href="/app/admin/messages"
              className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              💬 Recruit Messages
            </Link>
            <Link
              href="/app/leads/import"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              ⬆ Import CSV
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Stat label="Connectors" value={users.filter((u) => u.role === "connector").length} />
          <Stat label="Pending apps" value={pendingAppsCount} />
          <Stat label="Total leads" value={leads.length} />
          <Stat
            label="Won"
            value={leads.filter((l) => ["closed_won", "paid"].includes(l.status)).length}
          />
          <Stat label="Paid out" value={`$${totalPaid.toLocaleString()}`} />
        </div>

        {/* Users */}
        <section className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Connectors</h2>
            </div>
            {users.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No users yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Name</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Role</th>
                    <th className="text-left px-6 py-3 font-medium">Commission %</th>
                    <th className="text-left px-6 py-3 font-medium">Leads</th>
                    <th className="text-left px-6 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {u.name}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{u.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {u.role === "admin" ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (
                          <CommissionRateInput
                            userId={u.id}
                            currentRate={Number(u.commission_rate) || 0.3}
                          />
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{u.lead_count}</td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* All leads */}
        <section>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">All leads</h2>
            </div>
            {leads.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No leads submitted yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Lead</th>
                    <th className="text-left px-6 py-3 font-medium">Company</th>
                    <th className="text-left px-6 py-3 font-medium">Vendor</th>
                    <th className="text-left px-6 py-3 font-medium">Connector</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => {
                    const status = getStatusMeta(lead.status);
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <Link
                            href={`/app/leads/${lead.id}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {lead.lead_name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {lead.company}
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {lead.vendor || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {lead.owner_name}
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
        </section>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
        {label}
      </div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
