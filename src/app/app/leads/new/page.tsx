import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { AppShell } from "../../AppShell";
import { NewLeadForm } from "./NewLeadForm";

export default async function NewLeadPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");

  return (
    <AppShell user={session}>
      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href="/app"
            className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to leads
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Add a lead</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit someone from your network you'd like to refer to a vendor.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <NewLeadForm />
        </div>
      </div>
    </AppShell>
  );
}
