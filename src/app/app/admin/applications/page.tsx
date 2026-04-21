import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { ApplicationCard } from "./ApplicationCard";

interface Application {
  id: number;
  name: string;
  email: string;
  linkedin: string;
  industry: string | null;
  network: string;
  referral: string | null;
  status: "pending" | "approved" | "declined";
  review_note: string | null;
  reviewer_id: number | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_user_id: number | null;
  created_at: string;
}

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const applications = await query<Application>(
    `SELECT a.*, u.name AS reviewer_name
     FROM connector_applications a
     LEFT JOIN users u ON u.id = a.reviewer_id
     ORDER BY
       CASE a.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       a.created_at DESC`
  );

  const counts = {
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    declined: applications.filter((a) => a.status === "declined").length,
  };

  return (
    <AppShell user={session}>
      <div className="max-w-5xl mx-auto p-8">
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
                Connector Applications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review people who applied at the Referral Partner page.
                Approving creates a connector account and emails them a
                temporary password.
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <Stat label="Pending" count={counts.pending} highlight />
              <Stat label="Approved" count={counts.approved} />
              <Stat label="Declined" count={counts.declined} />
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500">
              No applications yet. Once someone submits the Referral Partner
              form, they&apos;ll show up here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <ApplicationCard key={app.id} app={app} />
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
