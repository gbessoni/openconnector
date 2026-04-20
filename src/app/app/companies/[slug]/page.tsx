import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { formatPayout, type Vendor } from "@/lib/leads";
import { PayoutTooltip } from "./PayoutTooltip";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function toList(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const { slug } = await params;
  const v = await queryOne<Vendor>(`SELECT * FROM vendors WHERE slug = $1`, [
    slug,
  ]);
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

  const icpBullets = toList(v.icp_bullets);
  const primaryBuyers = toList(v.primary_buyer);

  return (
    <AppShell user={session}>
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/app/companies"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to companies
          </Link>
          {isAdmin && (
            <Link
              href={`/app/admin/vendors/${v.slug}`}
              className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ✎ Edit vendor
            </Link>
          )}
        </div>

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
              <div className="flex items-center gap-1.5 justify-end mb-1">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Qualified Lead Payout
                </span>
                <PayoutTooltip />
              </div>
              <div className="text-2xl font-semibold text-green-700">
                {isAdmin
                  ? v.payout_text || "—"
                  : connectorPayout !== null
                  ? `up to ${formatPayout(connectorPayout)}`
                  : "—"}
              </div>
            </div>
          </div>

          {v.description && (
            <p className="text-gray-700 leading-relaxed mb-3">
              {v.description}
            </p>
          )}
          {v.long_description && (
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
              {v.long_description}
            </p>
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

        {/* ICP section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Ideal Customer Profile
          </h3>
          {v.icp && (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
              {v.icp}
            </p>
          )}
          {icpBullets.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {icpBullets.map((b, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400"
                >
                  {b}
                </li>
              ))}
            </ul>
          )}
          {primaryBuyers.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2">
                ICP Primary Buyer
              </h4>
              <ul className="space-y-1">
                {primaryBuyers.map((b, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!v.icp && icpBullets.length === 0 && primaryBuyers.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              No ICP details yet.
              {isAdmin && (
                <>
                  {" "}
                  <Link
                    href={`/app/admin/vendors/${v.slug}`}
                    className="text-indigo-600 hover:underline"
                  >
                    Add now
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

        {/* Target industries */}
        {v.target_industries && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Target Industries
            </h3>
            <div className="flex flex-wrap gap-2">
              {v.target_industries.split(",").map((ind) => (
                <span
                  key={ind}
                  className="inline-block bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-medium"
                >
                  {ind.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Commission notes — visible to everyone (it's general context, not admin-only numbers) */}
        {v.commission_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-900">
            {v.commission_notes}
          </div>
        )}

        {/* Admin-only cards */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        )}
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
