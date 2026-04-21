import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { AppShell } from "../../../../AppShell";
import { ProspectSearchForm } from "./ProspectSearchForm";
import { ProspectsList } from "./ProspectsList";
import type { Vendor } from "@/lib/leads";
import { formatPayout } from "@/lib/leads";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export interface Prospect {
  id: number;
  vendor_id: number;
  pdl_id: string;
  full_name: string;
  job_title: string | null;
  job_company_name: string | null;
  job_company_website: string | null;
  job_company_size: string | null;
  industry: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  location_name: string | null;
  location_country: string | null;
  work_email_available: boolean;
  status: string;
  contacted_at: string | null;
  replied_at: string | null;
  notes: string | null;
  created_at: string;
}

const DEFAULT_RATE = 0.3;

function buildPitch(vendor: Vendor, prospect: Prospect): string {
  const amount =
    typeof vendor.payout_amount === "string"
      ? parseFloat(vendor.payout_amount)
      : vendor.payout_amount;
  const cut = amount != null ? Number(amount) * DEFAULT_RATE : null;
  const cutStr = cut != null ? formatPayout(cut) : "real cash";

  const firstName = prospect.full_name.split(" ")[0];
  const icpSentence =
    vendor.icp?.split(/[.!?]/)[0]?.trim() ||
    vendor.target_industries ||
    "the right companies";

  return [
    `Hey ${firstName} — quick one.`,
    ``,
    `I'm building a warm-intro referral network called Leapify. We work with vetted vendors and pay connectors for qualified intros.`,
    ``,
    `One that might fit your network: ${vendor.name}. ${vendor.description || ""}`,
    ``,
    `Their ICP: ${icpSentence}.`,
    ``,
    `You'd earn up to ${cutStr} per qualified intro. If anyone in your network comes to mind, sign up in 60 seconds and submit: https://www.leapify.xyz/referral_connector.html`,
    ``,
    `No pressure — just thought you'd be the right person to flag this to.`,
  ].join("\n");
}

export default async function ProspectsPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const { slug } = await params;
  const vendor = await queryOne<Vendor>(
    `SELECT * FROM vendors WHERE slug = $1`,
    [slug]
  );
  if (!vendor) notFound();

  const prospects = await query<Prospect>(
    `SELECT * FROM prospects WHERE vendor_id = $1 ORDER BY
       CASE status
         WHEN 'new' THEN 0
         WHEN 'queued' THEN 1
         WHEN 'contacted' THEN 2
         WHEN 'replied' THEN 3
         WHEN 'converted' THEN 4
         WHEN 'declined' THEN 5
         ELSE 6
       END,
       created_at DESC`,
    [vendor.id]
  );

  const prospectsWithPitch = prospects.map((p) => ({
    ...p,
    pitch: buildPitch(vendor, p),
  }));

  const counts = {
    total: prospects.length,
    new: prospects.filter((p) => p.status === "new").length,
    contacted: prospects.filter((p) => p.status === "contacted").length,
    replied: prospects.filter((p) => p.status === "replied").length,
    converted: prospects.filter((p) => p.status === "converted").length,
  };

  const amount =
    typeof vendor.payout_amount === "string"
      ? parseFloat(vendor.payout_amount)
      : vendor.payout_amount;
  const cut = amount != null ? Number(amount) * DEFAULT_RATE : null;

  return (
    <AppShell user={session}>
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href={`/app/companies/${vendor.slug}`}
            className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to {vendor.name}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Prospects for {vendor.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                Find people whose network matches{" "}
                <span className="font-medium text-gray-700">
                  {vendor.name}
                </span>
                &apos;s ICP. Each prospect gets a personalized pitch you can
                copy + send via LinkedIn.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Per intro
              </div>
              <div className="text-lg font-semibold text-green-700">
                up to {cut != null ? formatPayout(cut) : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <Stat label="Total" value={counts.total} />
          <Stat label="New" value={counts.new} />
          <Stat label="Contacted" value={counts.contacted} />
          <Stat label="Replied" value={counts.replied} />
          <Stat label="Converted" value={counts.converted} highlight />
        </div>

        {/* Search form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Find more prospects</h2>
          <ProspectSearchForm vendor={vendor} />
        </div>

        {/* Prospect list */}
        {prospects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500 mb-2">No prospects yet.</p>
            <p className="text-xs text-gray-400">
              Fill in the filters above and click Search.
            </p>
          </div>
        ) : (
          <ProspectsList prospects={prospectsWithPitch} />
        )}
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`px-3 py-2.5 rounded-lg border ${
        highlight && value > 0
          ? "bg-green-50 border-green-200 text-green-900"
          : "bg-white border-gray-200 text-gray-700"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider font-medium text-gray-500">
        {label}
      </div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </div>
  );
}
