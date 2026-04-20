import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { ImportForm } from "./ImportForm";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const users = await query<{ id: number; name: string; email: string }>(
    `SELECT id, name, email FROM users ORDER BY name ASC`
  );

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
          <h1 className="text-2xl font-semibold text-gray-900">Import leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            Paste CSV or upload a file to bulk-add leads.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
          <p className="font-semibold text-blue-900 mb-2">CSV format</p>
          <p className="text-blue-800 mb-2">
            First row = headers. Supported columns (order doesn't matter):
          </p>
          <code className="block bg-white border border-blue-200 rounded p-2 text-xs text-blue-900 overflow-x-auto">
            lead_name, lead_email, lead_linkedin, company, company_website,
            title, vendor, category, why_fit, notes, status, owner_email
          </code>
          <p className="text-blue-800 mt-2">
            <strong>Required:</strong> <code>lead_name</code>,{" "}
            <code>company</code>
          </p>
          <p className="text-blue-800 mt-1">
            <strong>owner_email</strong> (optional): match by email to assign to
            that connector. If empty, the default owner below is used.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ImportForm users={users} />
        </div>
      </div>
    </AppShell>
  );
}
