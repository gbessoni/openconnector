import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { formatPayout, type Vendor } from "@/lib/leads";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const { slug } = await params;
  const v = await queryOne<Vendor>(
    `SELECT * FROM vendors WHERE slug = $1`,
    [slug]
  );
  if (!v) notFound();

  const isAdmin = session.role === "admin";
  const rate = session.commission_rate;
  const numericAmount =
    typeof v.payout_amount === "string"
      ? parseFloat(v.payout_amount)
      : v.payout_amount;
  const connectorPayout =
    numericAmount != null ? Number(numericAmount) * rate : null;

  const websiteUrl = v.website
    ? v.website.startsWith("http")
      ? v.website
      : `https://${v.website}`
    : null;

  return (
    <AppShell user={session}>
      <div className="max-w-4xl mx-auto p-8">
        <Link
          href="/app/companies"
          className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to companies
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{v.name}</h1>
              {v.category && (
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gray-500 mt-1.5">
                  {v.category}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-1">
                {isAdmin ? "Qualified lead payout" : "Your cut per qualified lead"}
              </div>
              <div className="text-2xl font-semibold text-green-700">
                {isAdmin
                  ? v.payout_text || "—"
                  : connectorPayout !== null
                  ? `up to ${formatPayout(connectorPayout)}`
                  : "—"}
              </div>
              {!isAdmin && (
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {(rate * 100).toFixed(0)}% commission rate
                </div>
              )}
            </div>
          </div>

          {v.description && (
            <p className="text-gray-700 leading-relaxed">{v.description}</p>
          )}

          <div className="mt-6 flex gap-3">
            <Link
              href={`/app/leads/new?vendor=${encodeURIComponent(v.name)}`}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              + Submit lead for {v.name}
            </Link>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Ideal Customer Profile">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {v.icp || "—"}
            </p>
          </Card>

          <Card title="Target Industries">
            <p className="text-sm text-gray-700">
              {v.target_industries || "—"}
            </p>
          </Card>

          {isAdmin && (
            <>
              <Card title="Vendor contact (admin only)">
                <DetailRow label="Email" value={v.email} />
                <DetailRow
                  label="Website"
                  value={
                    websiteUrl ? (
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {v.website}
                      </a>
                    ) : null
                  }
                />
              </Card>

              <Card title="Vendor economics (admin only)">
                <DetailRow label="Qualified lead payout" value={v.payout_text} />
                <DetailRow label="Commission" value={v.commission_text} />
                <DetailRow
                  label="Numeric cap"
                  value={
                    numericAmount != null ? formatPayout(numericAmount) : null
                  }
                />
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm">{title}</h3>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex py-1.5 text-sm">
      <div className="w-36 shrink-0 text-gray-500">{label}</div>
      <div className="text-gray-900">
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}
