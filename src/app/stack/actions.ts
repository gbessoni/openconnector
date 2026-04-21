"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { query } from "@/lib/db";
import { generateStack } from "@/lib/anthropic";
import type { Vendor } from "@/lib/leads";

// Rough rate limit: max 10 stack generations per IP per hour (in-memory, resets on deploy)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 10;

function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitCache.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitCache.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true, remaining: RATE_MAX - 1 };
  }
  if (entry.count >= RATE_MAX) return { ok: false, remaining: 0 };
  entry.count++;
  return { ok: true, remaining: RATE_MAX - entry.count };
}

function makeUniqueSlug(hint: string, taken: Set<string>): string {
  const base =
    hint
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "stack";
  if (!taken.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function generateStackAction(formData: FormData) {
  const queryText = String(formData.get("query") || "").trim();

  if (!queryText || queryText.length < 10) {
    return { error: "Tell me a bit more about your company (at least 10 characters)." };
  }
  if (queryText.length > 2000) {
    return { error: "Keep it under 2,000 characters." };
  }

  // Rate limit by IP
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const rate = checkRateLimit(ip);
  if (!rate.ok) {
    return { error: "Too many stacks in the last hour. Try again in a bit." };
  }

  // Load vendors with a numeric payout and non-empty icp (we want usable ones)
  const vendors = await query<Vendor>(
    `SELECT id, slug, name, target_industries, category, payout_text, payout_amount,
            commission_text, description, icp, email, website, country, status, created_at, updated_at
     FROM vendors
     WHERE status = 'active'
     ORDER BY payout_amount DESC NULLS LAST`
  );

  if (vendors.length === 0) {
    return { error: "No vendors available yet." };
  }

  let result;
  try {
    result = await generateStack(queryText, vendors);
  } catch (e) {
    console.error("Claude generateStack failed", e);
    return { error: "The AI had a moment. Try again — and if it keeps failing, simplify the query." };
  }

  if (!result.picks || result.picks.length === 0) {
    return { error: "Couldn't find a good match. Try adding more detail about what you need." };
  }

  // Get taken slugs to avoid collision
  const existing = await query<{ slug: string }>(
    `SELECT slug FROM stacks WHERE slug LIKE $1 || '%' LIMIT 100`,
    [result.slug_hint.slice(0, 40)]
  );
  const taken = new Set(existing.map((r) => r.slug));
  const slug = makeUniqueSlug(result.slug_hint || result.stack_title, taken);

  await query(
    `INSERT INTO stacks (slug, query_text, stack_title, inferred_profile, picks, created_by_ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      slug,
      queryText,
      result.stack_title,
      JSON.stringify(result.inferred_profile),
      JSON.stringify({ picks: result.picks, summary: result.summary }),
      ip,
    ]
  );

  redirect(`/stack/${slug}`);
}
