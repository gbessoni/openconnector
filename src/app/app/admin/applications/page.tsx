import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { ApplicationRow } from "./ApplicationRow";

interface ApplicationRecord {
  id: number;
  name: string;
  email: string;
  linkedin: string;
  industry: string | null;
  network: string;
  referral: string | null;
  status: "pending" | "approved" | "declined";
  review_note: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const apps = await query<ApplicationRecord>(
    `SELECT a.id, a.name, a.email, a.linkedin, a.industry, a.network, a.referral,
            a.status, a.review_note, a.reviewed_at, a.created_at,
            u.name AS reviewer_name
       FROM connector_applications a
       LEFT JOIN users u ON u.id = a.reviewer_id
       ORDER BY
         CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END,
         a.created_at DESC`
  );

  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  return (
    <AppShell user={session}>
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href="/app/admin"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to admin
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">
            Connector applications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Approve or decline people who applied via the referral form.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Nothing to review.
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((a) => (
                <ApplicationRow key={a.id} app={a} />
              ))}
            </div>
          )}
        </section>

        {reviewed.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
              Reviewed ({reviewed.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Name</th>
                    <th className="text-left px-6 py-3 font-medium">Email</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Reviewer</th>
                    <th className="text-left px-6 py-3 font-medium">Reviewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reviewed.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {a.name}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{a.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            a.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {a.reviewer_name || "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {a.reviewed_at
                          ? new Date(a.reviewed_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
