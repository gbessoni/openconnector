import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../AppShell";
import { formatPayout, type Vendor } from "@/lib/leads";

export default async function CompaniesPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const vendors = await query<Vendor>(
    `SELECT id, slug, name, target_industries, category, payout_text, payout_amount,
            commission_text, description, icp, email, website, status, created_at, updated_at
     FROM vendors WHERE status = 'active' ORDER BY name ASC`
  );

  const isAdmin = session.role === "admin";
  const rate = session.commission_rate;

  // Categories for filter display
  const categories = Array.from(
    new Set(vendors.map((v) => v.category).filter(Boolean))
  ).sort();

  return (
    <AppShell user={session}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Companies</h1>
            <p className="text-sm text-gray-500 mt-1">
              Vetted vendors you can pitch to your network.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-gray-500">
              Total
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {vendors.length}
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium self-center mr-2">
            Categories:
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-block bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-medium"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Vendor grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => {
            const numericAmount =
              typeof v.payout_amount === "string"
                ? parseFloat(v.payout_amount)
                : v.payout_amount;
            const connectorPayout =
              numericAmount != null ? Number(numericAmount) * rate : null;
            return (
              <Link
                key={v.id}
                href={`/app/companies/${v.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:underline">
                      {v.name}
                    </h3>
                    {v.category && (
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1">
                        {v.category}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      Qualified Lead Payout
                    </div>
                    <div className="text-sm font-semibold text-green-700">
                      {isAdmin
                        ? v.payout_text || "—"
                        : connectorPayout !== null
                        ? `up to ${formatPayout(connectorPayout)}`
                        : "—"}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {v.description}
                </p>
                {v.target_industries && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                      Target:
                    </span>{" "}
                    <span className="text-xs text-gray-600">
                      {v.target_industries}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
