import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { HunterRow } from "./HunterRow";

interface HunterSignup {
  id: number;
  name: string;
  email: string;
  linkedin: string | null;
  phone: string | null;
  background: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_paid_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default async function AdminHuntersPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const hunters = await query<HunterSignup>(
    `SELECT * FROM hunter_signups
     ORDER BY
       CASE status
         WHEN 'active' THEN 0
         WHEN 'paid' THEN 1
         WHEN 'checkout_sent' THEN 2
         WHEN 'pending' THEN 3
         WHEN 'cancelled' THEN 4
         WHEN 'refunded' THEN 5
         ELSE 6
       END,
       created_at DESC`
  );

  const counts = {
    total: hunters.length,
    active: hunters.filter((h) => h.status === "active").length,
    paid: hunters.filter((h) => h.status === "paid").length,
    cancelled: hunters.filter((h) => h.status === "cancelled" || h.status === "refunded").length,
    last7d: hunters.filter(
      (h) =>
        new Date(h.created_at).getTime() >
        Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length,
  };

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
                Hunter signups
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Everyone who signed up via{" "}
                <a href="https://www.leapify.xyz/hunter" className="underline">
                  /hunter
                </a>
                . Free tier — users can refer leads from their own network.
                The $49/mo kicks in later if they upgrade to the in-app lead
                finder.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <Stat label="Total" count={counts.total} highlight />
              <Stat label="Active" count={counts.active} />
              <Stat label="Last 7 days" count={counts.last7d} />
              <Stat label="Paid (upgrade)" count={counts.paid} />
              <Stat label="Cancelled" count={counts.cancelled} />
            </div>
          </div>
        </div>

        {hunters.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500">
              No hunter signups yet. Share{" "}
              <a
                href="https://www.leapify.xyz/hunter"
                className="text-indigo-600 underline"
              >
                /hunter
              </a>{" "}
              to start getting them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {hunters.map((h) => (
              <HunterRow key={h.id} hunter={h} />
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
  count: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border ${
        highlight
          ? "bg-green-50 border-green-200 text-green-900"
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
