import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { AppShell } from "../../../AppShell";
import { VendorEditForm } from "./VendorEditForm";
import type { Vendor } from "@/lib/leads";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditVendorPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const { slug } = await params;
  const vendor = await queryOne<Vendor>(
    `SELECT * FROM vendors WHERE slug = $1`,
    [slug]
  );
  if (!vendor) notFound();

  return (
    <AppShell user={session}>
      <div className="max-w-3xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href={`/app/companies/${vendor.slug}`}
            className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to {vendor.name}
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit {vendor.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enrich vendor details. Connectors see everything except the vendor
            email.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <VendorEditForm vendor={vendor} />
        </div>
      </div>
    </AppShell>
  );
}
