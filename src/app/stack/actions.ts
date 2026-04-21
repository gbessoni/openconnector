"use server";

import { query, queryOne } from "@/lib/db";
import { generateMatchReasons, type LeadContext } from "@/lib/anthropic";
import type { Vendor } from "@/lib/leads";
import vendorMatches from "@/data/vendor-matches.json";

export interface StackLeadFormData {
  name: string;
  email: string;
  linkedin: string;
  company: string;
  title: string;
  website: string;
  revenue: string;
  employees: string;
  industry: string;
  searched_vendor: string;
  problem: string;
}

export interface MatchedVendor {
  slug: string;
  name: string;
  category: string | null;
  tagline: string;
  match_reason: string;
}

export interface SubmitResult {
  success: true;
  lead_id: number;
  matches: MatchedVendor[];
  lead_email: string;
}

export interface SubmitError {
  error: string;
}

function lookupVendorSlugs(searchedVendor: string): string[] {
  const key = searchedVendor.trim().toLowerCase();
  const raw = vendorMatches as unknown as Record<string, unknown>;
  const map: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "_comment") continue;
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      map[k] = v as string[];
    }
  }
  if (map[key]) return map[key];
  // Try partial match (e.g. "Rippling HR" → "rippling")
  for (const mapKey of Object.keys(map)) {
    if (mapKey === "_default") continue;
    if (key.includes(mapKey) || mapKey.includes(key)) return map[mapKey];
  }
  return map["_default"] ?? [];
}

// Quick 3-pick AI matcher for the NL flow (organic traffic, no vendor param)
async function aiPickThreeVendors(
  nlQuery: string,
  vendors: Vendor[]
): Promise<string[]> {
  const { generateStack } = await import("@/lib/anthropic");
  const result = await generateStack(nlQuery, vendors);
  // Flatten picks → ordered by category relevance → top pick per category first
  const slugs: string[] = [];
  for (const p of result.picks) {
    if (p.top_pick?.vendor_slug) slugs.push(p.top_pick.vendor_slug);
    if (slugs.length >= 3) break;
  }
  // If we didn't get 3 from top picks, fill with alternatives
  if (slugs.length < 3) {
    for (const p of result.picks) {
      if (p.alternative?.vendor_slug && !slugs.includes(p.alternative.vendor_slug)) {
        slugs.push(p.alternative.vendor_slug);
        if (slugs.length >= 3) break;
      }
    }
  }
  return slugs.slice(0, 3);
}

export async function submitStackLeadNLAction(
  formData: FormData
): Promise<SubmitResult | SubmitError> {
  const get = (k: string) => String(formData.get(k) || "").trim();

  const lead = {
    name: get("name"),
    email: get("email"),
    linkedin: get("linkedin"),
    company: get("company"),
    title: get("title"),
    website: get("website"),
    revenue: get("revenue"),
    employees: get("employees"),
    industry: get("industry"),
    nl_query: get("nl_query"),
  };

  if (!lead.name || !lead.email || !lead.company) {
    return { error: "Name, email, and company are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return { error: "Enter a valid work email." };
  }
  if (!lead.nl_query || lead.nl_query.length < 15) {
    return { error: "Tell us a bit more about what you're looking for." };
  }

  const vendors = await query<Vendor>(
    `SELECT id, slug, name, target_industries, category, payout_text, payout_amount,
            commission_text, description, long_description, icp, icp_bullets, primary_buyer,
            commission_notes, email, website, country, status, created_at, updated_at
     FROM vendors WHERE status = 'active'`
  );

  let slugs: string[];
  try {
    slugs = await aiPickThreeVendors(lead.nl_query, vendors);
  } catch (e) {
    console.error("aiPickThreeVendors failed", e);
    return {
      error: "Our AI had a moment. Try simpler language or try again.",
    };
  }

  if (slugs.length === 0) {
    return { error: "Couldn't find a good match. Add more detail and try again." };
  }

  const vendorBySlug = new Map(vendors.map((v) => [v.slug, v]));
  const ordered = slugs
    .map((s) => vendorBySlug.get(s))
    .filter((v): v is Vendor => !!v)
    .slice(0, 3);

  const context: LeadContext = {
    company: lead.company,
    industry: lead.industry || null,
    revenue: lead.revenue || null,
    employees: lead.employees || null,
    searched_vendor: null,
    problem: lead.nl_query,
  };

  let reasons: string[];
  try {
    reasons = await generateMatchReasons(
      ordered.map((v) => ({ vendor: v, lead: context }))
    );
  } catch (e) {
    console.error("generateMatchReasons failed", e);
    reasons = ordered.map(
      (v) => v.description?.split(/[.!?]/)[0] ?? `A strong fit for ${lead.company}.`
    );
  }

  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO stack_leads
      (name, email, linkedin, company, title, website, revenue, employees,
       industry, searched_vendor, problem, matched_vendors, status,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'submitted',
             $13,$14,$15,$16,$17)
     RETURNING id`,
    [
      lead.name,
      lead.email.toLowerCase(),
      lead.linkedin || null,
      lead.company,
      lead.title || null,
      lead.website || null,
      lead.revenue || null,
      lead.employees || null,
      lead.industry || null,
      "AI match (NL)",
      lead.nl_query,
      JSON.stringify(ordered.map((v) => v.slug)),
      get("utm_source") || null,
      get("utm_medium") || null,
      get("utm_campaign") || null,
      get("utm_content") || null,
      get("utm_term") || null,
    ]
  );
  if (!inserted) return { error: "Couldn't save lead. Try again." };

  const matches: MatchedVendor[] = ordered.map((v, i) => ({
    slug: v.slug,
    name: v.name,
    category: v.category,
    tagline: v.description?.split(/[.!?]/)[0]?.trim() ?? "",
    match_reason: reasons[i] || "",
  }));

  return {
    success: true,
    lead_id: inserted.id,
    matches,
    lead_email: lead.email,
  };
}

// Need to import LeadContext at file top for the NL action above
// (redeclare here for clarity — already imported in generateMatchReasons scope)

export async function submitStackLeadAction(
  formData: FormData
): Promise<SubmitResult | SubmitError> {
  const get = (k: string) => String(formData.get(k) || "").trim();

  const lead: StackLeadFormData = {
    name: get("name"),
    email: get("email"),
    linkedin: get("linkedin"),
    company: get("company"),
    title: get("title"),
    website: get("website"),
    revenue: get("revenue"),
    employees: get("employees"),
    industry: get("industry"),
    searched_vendor: get("searched_vendor"),
    problem: get("problem"),
  };

  // Validation
  if (!lead.name || !lead.email || !lead.company) {
    return { error: "Name, email, and company are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return { error: "Enter a valid work email." };
  }
  if (!lead.searched_vendor) {
    return { error: "Tell us which vendor you were searching for." };
  }
  if (!lead.problem || lead.problem.length < 10) {
    return { error: "Add a sentence about what problem you're solving." };
  }

  // Lookup matches
  const slugs = lookupVendorSlugs(lead.searched_vendor);
  if (slugs.length === 0) {
    return { error: "Couldn't find matches. Try a different vendor name." };
  }

  const vendors = await query<Vendor>(
    `SELECT id, slug, name, target_industries, category, payout_text, payout_amount,
            commission_text, description, long_description, icp, icp_bullets, primary_buyer,
            commission_notes, email, website, country, status, created_at, updated_at
     FROM vendors WHERE slug = ANY($1) AND status = 'active'`,
    [slugs]
  );

  // Preserve the order from the JSON mapping
  const vendorBySlug = new Map(vendors.map((v) => [v.slug, v]));
  const ordered = slugs
    .map((s) => vendorBySlug.get(s))
    .filter((v): v is Vendor => !!v)
    .slice(0, 3);

  if (ordered.length === 0) {
    return { error: "No matches available right now. We'll reach out manually." };
  }

  // Generate personalized match reasons via Claude
  const context: LeadContext = {
    company: lead.company,
    industry: lead.industry || null,
    revenue: lead.revenue || null,
    employees: lead.employees || null,
    searched_vendor: lead.searched_vendor || null,
    problem: lead.problem || null,
  };

  let reasons: string[];
  try {
    reasons = await generateMatchReasons(
      ordered.map((v) => ({ vendor: v, lead: context }))
    );
  } catch (e) {
    console.error("generateMatchReasons failed", e);
    // Fallback: use vendor description as reason
    reasons = ordered.map(
      (v) => v.description?.split(/[.!?]/)[0] ?? `A strong fit for ${lead.company}.`
    );
  }

  // Save lead to DB (with UTM attribution if provided)
  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO stack_leads
      (name, email, linkedin, company, title, website, revenue, employees,
       industry, searched_vendor, problem, matched_vendors, status,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'submitted',
             $13,$14,$15,$16,$17)
     RETURNING id`,
    [
      lead.name,
      lead.email.toLowerCase(),
      lead.linkedin || null,
      lead.company,
      lead.title || null,
      lead.website || null,
      lead.revenue || null,
      lead.employees || null,
      lead.industry || null,
      lead.searched_vendor,
      lead.problem,
      JSON.stringify(ordered.map((v) => v.slug)),
      get("utm_source") || null,
      get("utm_medium") || null,
      get("utm_campaign") || null,
      get("utm_content") || null,
      get("utm_term") || null,
    ]
  );
  if (!inserted) {
    return { error: "Couldn't save lead. Try again." };
  }

  const matches: MatchedVendor[] = ordered.map((v, i) => ({
    slug: v.slug,
    name: v.name,
    category: v.category,
    tagline: v.description?.split(/[.!?]/)[0]?.trim() ?? "",
    match_reason: reasons[i] || "",
  }));

  return {
    success: true,
    lead_id: inserted.id,
    matches,
    lead_email: lead.email,
  };
}

export async function confirmMeetingsAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const leadId = Number(formData.get("lead_id"));
  const selectedRaw = String(formData.get("selected_vendors") || "");
  const selectedVendors = selectedRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!leadId || selectedVendors.length === 0) {
    return { error: "Select at least one vendor to meet with." };
  }

  const lead = await queryOne<{
    id: number;
    name: string;
    email: string;
    linkedin: string | null;
    title: string | null;
    company: string;
    website: string | null;
    revenue: string | null;
    employees: string | null;
    industry: string | null;
    searched_vendor: string;
    problem: string;
    matched_vendors: string[];
  }>(
    `SELECT id, name, email, linkedin, title, company, website, revenue, employees,
            industry, searched_vendor, problem, matched_vendors
     FROM stack_leads WHERE id = $1`,
    [leadId]
  );
  if (!lead) return { error: "Lead not found." };

  await query(
    `UPDATE stack_leads
     SET selected_vendors = $1, status = 'meetings_selected', updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(selectedVendors), leadId]
  );

  // Email Greg via Resend
  const resendKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (resendKey && notificationEmail) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);

      // Look up selected vendor details
      const vendors = await query<{
        slug: string;
        name: string;
        email: string | null;
      }>(
        `SELECT slug, name, email FROM vendors WHERE slug = ANY($1)`,
        [selectedVendors]
      );
      const vendorList = vendors
        .map(
          (v) =>
            `• <strong>${v.name}</strong>${v.email ? ` — ${v.email}` : ""}`
        )
        .join("<br>");

      await resend.emails.send({
        from: "Leapify <onboarding@resend.dev>",
        to: notificationEmail,
        subject: `🎯 Stack lead: ${lead.name} at ${lead.company} wants ${selectedVendors.length} intro(s)`,
        html: `
          <h2>New Stack match submission</h2>
          <p><strong>${lead.name}</strong>${lead.title ? ` (${lead.title})` : ""} at <strong>${lead.company}</strong> wants to meet with:</p>
          <p>${vendorList}</p>
          <hr>
          <h3>Lead details</h3>
          <p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>
          ${lead.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${lead.linkedin}" target="_blank">${lead.linkedin}</a></p>` : ""}
          ${lead.website ? `<p><strong>Website:</strong> <a href="${lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}" target="_blank">${lead.website}</a></p>` : ""}
          ${lead.revenue ? `<p><strong>Revenue:</strong> ${lead.revenue}</p>` : ""}
          ${lead.employees ? `<p><strong>Employees:</strong> ${lead.employees}</p>` : ""}
          ${lead.industry ? `<p><strong>Industry:</strong> ${lead.industry}</p>` : ""}
          <hr>
          <p><strong>Searched for:</strong> ${lead.searched_vendor}</p>
          <p><strong>Problem:</strong> ${lead.problem}</p>
          <hr>
          <p><a href="https://www.leapify.xyz/app/admin/stack">View in admin →</a></p>
          <p><small>Lead ID: ${lead.id}. Promised 24h turnaround — send the calendar link.</small></p>
        `,
      });
    } catch (e) {
      console.error("Failed to email stack lead notification", e);
    }
  }

  return { success: true };
}
