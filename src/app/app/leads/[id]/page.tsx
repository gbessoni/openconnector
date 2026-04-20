import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { LEAD_STATUSES, getStatusMeta, type Lead, type LeadEvent } from "@/lib/leads";
import { LeadActions } from "./LeadActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) notFound();

  const lead = await queryOne<Lead & { owner_name: string; owner_email: string }>(
    `SELECT l.*, u.name AS owner_name, u.email AS owner_email
     FROM leads l JOIN users u ON u.id = l.owner_id
     WHERE l.id = $1`,
    [id]
  );
  if (!lead) notFound();

  // Auth: only owner or admin
  if (session.role !== "admin" && lead.owner_id !== session.id) {
    notFound();
  }

  const events = await query<LeadEvent & { actor_name: string | null }>(
    `SELECT e.*, u.name AS actor_name
     FROM lead_events e LEFT JOIN users u ON u.id = e.actor_id
     WHERE e.lead_id = $1 ORDER BY e.created_at DESC`,
    [id]
  );

  const status = getStatusMeta(lead.status);

  return (
    <AppShell user={session}>
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-6">
          <Link
            href={session.role === "admin" ? "/app/admin" : "/app"}
            className="text-sm text-gray-500 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {lead.lead_name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {lead.title ? `${lead.title} at ` : ""}
                {lead.company}
              </p>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: lead details */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Lead Information">
              <DetailRow label="Name" value={lead.lead_name} />
              <DetailRow
                label="Email"
                value={
                  lead.lead_email ? (
                    <a
                      href={`mailto:${lead.lead_email}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {lead.lead_email}
                    </a>
                  ) : null
                }
              />
              <DetailRow
                label="LinkedIn"
                value={
                  lead.lead_linkedin ? (
                    <a
                      href={lead.lead_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      View profile →
                    </a>
                  ) : null
                }
              />
              <DetailRow label="Title" value={lead.title} />
              <DetailRow label="Company" value={lead.company} />
              <DetailRow
                label="Website"
                value={
                  lead.company_website ? (
                    <a
                      href={lead.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {lead.company_website}
                    </a>
                  ) : null
                }
              />
              <DetailRow label="Vendor" value={lead.vendor} />
              <DetailRow label="Category" value={lead.category} />
            </Card>

            {(lead.why_fit || lead.notes) && (
              <Card title="Context">
                {lead.why_fit && (
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">
                      Why it's a fit
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {lead.why_fit}
                    </p>
                  </div>
                )}
                {lead.notes && (
                  <div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">
                      Notes
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </Card>
            )}

            <Card title="Activity">
              {events.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet.</p>
              ) : (
                <ul className="space-y-4">
                  {events.map((ev) => (
                    <li
                      key={ev.id}
                      className="border-l-2 border-gray-200 pl-4 py-1"
                    >
                      <div className="text-sm text-gray-700">
                        {renderEvent(ev)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {ev.actor_name && `${ev.actor_name} · `}
                        {new Date(ev.created_at).toLocaleString()}
                      </div>
                      {ev.note && ev.event_type !== "note" && (
                        <div className="text-xs text-gray-600 mt-1 italic">
                          "{ev.note}"
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Right: actions */}
          <div className="space-y-6">
            <Card title="Update Status">
              <LeadActions
                leadId={lead.id}
                currentStatus={lead.status}
                statuses={[...LEAD_STATUSES]}
              />
            </Card>

            <Card title="Owner">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{lead.owner_name}</p>
                <p className="text-gray-500 text-xs">{lead.owner_email}</p>
              </div>
            </Card>

            <Card title="Submitted">
              <p className="text-sm text-gray-700">
                {new Date(lead.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Updated {new Date(lead.updated_at).toLocaleDateString()}
              </p>
            </Card>
          </div>
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
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">{title}</h3>
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
      <div className="w-28 shrink-0 text-gray-500">{label}</div>
      <div className="text-gray-900">
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
  );
}

function renderEvent(ev: LeadEvent & { actor_name: string | null }) {
  if (ev.event_type === "status_change") {
    const from = getStatusMeta(ev.from_status || "");
    const to = getStatusMeta(ev.to_status || "");
    return (
      <>
        Status changed from{" "}
        <span className="font-medium">{from.label}</span> to{" "}
        <span className="font-medium">{to.label}</span>
      </>
    );
  }
  if (ev.event_type === "note") {
    return (
      <>
        <span className="font-medium">Note:</span> {ev.note}
      </>
    );
  }
  if (ev.event_type === "created") {
    return <>Lead submitted</>;
  }
  return ev.event_type;
}
