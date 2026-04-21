import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../AppShell";
import { type Vendor } from "@/lib/leads";
import { CompaniesBrowser } from "./CompaniesBrowser";

export default async function CompaniesPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const vendors = await query<Vendor>(
    `SELECT id, slug, name, target_industries, category, payout_text, payout_amount,
            commission_text, description, icp, email, website, country, status,
            created_at, updated_at
     FROM vendors WHERE status = 'active' ORDER BY name ASC`
  );

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

        <CompaniesBrowser
          vendors={vendors}
          isAdmin={session.role === "admin"}
          commissionRate={session.commission_rate}
        />
      </div>
    </AppShell>
  );
}
