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

  // Save lead to DB
  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO stack_leads
      (name, email, linkedin, company, title, website, revenue, employees,
       industry, searched_vendor, problem, matched_vendors, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'submitted')
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
    company: string;
    searched_vendor: string;
    problem: string;
    matched_vendors: string[];
  }>(
    `SELECT id, name, email, company, searched_vendor, problem, matched_vendors
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
          <p><strong>${lead.name}</strong> at <strong>${lead.company}</strong> wants to meet with:</p>
          <p>${vendorList}</p>
          <hr>
          <p><strong>Email:</strong> ${lead.email}</p>
          <p><strong>Searched for:</strong> ${lead.searched_vendor}</p>
          <p><strong>Problem:</strong> ${lead.problem}</p>
          <hr>
          <p>Lead ID: ${lead.id}. Promised 24h turnaround — send the calendar link.</p>
        `,
      });
    } catch (e) {
      console.error("Failed to email stack lead notification", e);
    }
  }

  return { success: true };
}
