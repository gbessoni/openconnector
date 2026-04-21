"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { query, queryOne } from "@/lib/db";
import { parseICPQuery } from "@/lib/anthropic";
import { searchPeople, toProspectInsert } from "@/lib/pdl";

const DAILY_CREDIT_CAP = 500; // ~$25/day at $0.05/credit. Raise when revenue justifies.
const RESULTS_PER_SEARCH = 25;
const MAX_SEARCHES_PER_IP_PER_DAY = 3;

function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "search"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  const slug = slugify(base);
  const taken = await query<{ slug: string }>(
    `SELECT slug FROM public_searches WHERE slug LIKE $1 || '%' LIMIT 50`,
    [slug]
  );
  const set = new Set(taken.map((t) => t.slug));
  if (!set.has(slug)) return slug;
  for (let i = 2; i < 100; i++) {
    const cand = `${slug}-${i}`;
    if (!set.has(cand)) return cand;
  }
  return `${slug}-${Math.random().toString(36).slice(2, 7)}`;
}

async function hasCapacity(requestedCredits: number): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const row = await queryOne<{ credits_used: number }>(
    `SELECT credits_used FROM pdl_daily_spend WHERE day = $1`,
    [today]
  );
  const used = row?.credits_used ?? 0;
  return used + requestedCredits <= DAILY_CREDIT_CAP;
}

async function recordSpend(credits: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await query(
    `INSERT INTO pdl_daily_spend (day, credits_used)
     VALUES ($1, $2)
     ON CONFLICT (day) DO UPDATE SET credits_used = pdl_daily_spend.credits_used + $2, updated_at = NOW()`,
    [today, credits]
  );
}

// Count searches made by this IP in the last 24 hours.
// Used for abuse prevention only — not a paywall.
async function getSearchesLast24h(ip: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM public_searches
     WHERE created_by_ip = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
    [ip]
  );
  return row?.count ?? 0;
}

async function bumpIpUsage(ip: string): Promise<void> {
  await query(
    `INSERT INTO find_leads_usage (ip, search_count)
     VALUES ($1, 1)
     ON CONFLICT (ip) DO UPDATE SET search_count = find_leads_usage.search_count + 1, last_search_at = NOW()`,
    [ip]
  );
}

export async function searchLeadsAction(formData: FormData) {
  const nl = String(formData.get("query") || "").trim();
  if (nl.length < 10) {
    return { error: "Describe your ideal customer in a sentence or two." };
  }
  if (nl.length > 1000) {
    return { error: "Keep it under 1,000 characters." };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  // Abuse prevention: cap searches per IP per day
  const recent = await getSearchesLast24h(ip);
  if (recent >= MAX_SEARCHES_PER_IP_PER_DAY) {
    return {
      error: `You've used your ${MAX_SEARCHES_PER_IP_PER_DAY} free searches today. Join Hunter for $49/mo and get unlimited searches plus pitch templates and guaranteed leads.`,
      upgrade: true,
    };
  }

  // Daily global cost cap — separate from per-user rate limit
  if (!(await hasCapacity(RESULTS_PER_SEARCH))) {
    return {
      error: "Our free tool hit today's capacity limit. Come back tomorrow, or skip the line with Hunter ($49/mo — unlimited searches).",
      upgrade: true,
    };
  }

  // Claude parse
  let parsed;
  try {
    parsed = await parseICPQuery(nl);
  } catch (e) {
    console.error("parseICPQuery failed", e);
    return { error: "Couldn't parse that. Try simpler language." };
  }

  // PDL search
  let pdlResult;
  try {
    pdlResult = await searchPeople(parsed.filters);
  } catch (e) {
    console.error("PDL search failed", e);
    return { error: "Lead data service is down. Try again in a minute." };
  }

  if (pdlResult.status !== 200 && pdlResult.status !== 404) {
    console.error("PDL non-200 status", pdlResult);
    return {
      error: pdlResult.error?.message
        ? `Search error: ${pdlResult.error.message}`
        : "Search returned an error. Try simpler criteria.",
    };
  }

  const rawPeople = pdlResult.data || [];
  if (rawPeople.length === 0) {
    return {
      error:
        "No matching prospects. Try broader criteria (e.g. multiple titles, wider company sizes).",
    };
  }

  const records = rawPeople
    .map(toProspectInsert)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  await recordSpend(records.length);
  await bumpIpUsage(ip);

  const slug = await uniqueSlug(parsed.display_label);

  await query(
    `INSERT INTO public_searches (slug, query_text, pdl_filters, results_json,
       pdl_total, pdl_returned, pdl_credits_used, created_by_ip,
       unlocked, unlock_method, unlocked_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, TRUE, 'free', NOW())`,
    [
      slug,
      nl,
      JSON.stringify({ ...parsed.filters, display_label: parsed.display_label }),
      JSON.stringify(records),
      pdlResult.total || 0,
      records.length,
      records.length,
      ip,
    ]
  );

  redirect(`/find-leads/${slug}`);
}

export async function unlockLeadsAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const method = String(formData.get("method") || "");
  const email = String(formData.get("email") || "").trim();

  if (!slug) return { error: "Missing slug" };
  if (!["share_x", "share_linkedin", "email"].includes(method)) {
    return { error: "Invalid unlock method" };
  }
  if (method === "email") {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Valid email required" };
    }
  }

  await query(
    `UPDATE public_searches
     SET unlocked = TRUE, unlock_method = $1, unlocked_at = NOW(), captured_email = $2
     WHERE slug = $3 AND unlocked = FALSE`,
    [method, email || null, slug]
  );

  return { success: true };
}
