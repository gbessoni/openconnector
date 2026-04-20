import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AppShell } from "../../AppShell";
import { formatPayout, type Vendor } from "@/lib/leads";
import { MessagesList } from "./MessagesList";

const DEFAULT_RATE = 0.3;
const SIGNUP_URL = "https://www.leapify.xyz/referral_connector.html";

function firstSentence(text: string | null): string {
  if (!text) return "";
  const match = text.match(/^[^.!?]+[.!?]/);
  return (match ? match[0] : text).trim();
}

function buildMessage(v: Vendor): string {
  const amount =
    typeof v.payout_amount === "string"
      ? parseFloat(v.payout_amount)
      : v.payout_amount;
  const cut = amount != null ? Number(amount) * DEFAULT_RATE : null;
  const cutStr = cut != null ? formatPayout(cut) : null;

  const hook = cutStr
    ? `Earn up to ${cutStr} per warm intro to ${v.name}.`
    : `Earn real cash per warm intro to ${v.name}.`;

  const what = firstSentence(v.description) || `${v.name} is vetted and ready to work with your network.`;

  const who = firstSentence(v.icp) ||
    (v.target_industries
      ? `They want intros into ${v.target_industries}.`
      : `If you know their buyer, you already have the intro.`);

  const cta = `Know someone? Sign up in 60 seconds → ${SIGNUP_URL}`;

  return [hook, "", what, "", who, "", cta].join("\n");
}

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") redirect("/app");

  const vendors = await query<Vendor>(
    `SELECT * FROM vendors WHERE status = 'active' ORDER BY
      CASE WHEN payout_amount IS NULL THEN 1 ELSE 0 END,
      payout_amount DESC NULLS LAST,
      name ASC`
  );

  const items = vendors.map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    category: v.category,
    payoutAmount:
      typeof v.payout_amount === "string"
        ? parseFloat(v.payout_amount)
        : v.payout_amount,
    message: buildMessage(v),
  }));

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
          <h1 className="text-2xl font-semibold text-gray-900">
            Recruiting messages
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            One ready-to-send pitch per vendor. The $ amount shown is{" "}
            <strong>{(DEFAULT_RATE * 100).toFixed(0)}%</strong> of the qualified
            lead payout — use these to recruit connectors who already know the
            right people. Copy, paste into LinkedIn DMs, email, or Slack.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900">
          <p>
            <strong>Tip:</strong> Post these on LinkedIn as &quot;Know someone
            who needs X?&quot; or send as a direct DM to someone whose network
            matches the ICP. The signup link goes to the Referral Partner
            landing page.
          </p>
        </div>

        <MessagesList items={items} />
      </div>
    </AppShell>
  );
}
