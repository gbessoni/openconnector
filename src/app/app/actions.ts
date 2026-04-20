"use server";

import { redirect } from "next/navigation";
import {
  authenticate,
  createSession,
  clearSession,
  createUser,
  getSession,
} from "@/lib/auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password required" };
  }

  const user = await authenticate(email, password);
  if (!user) {
    return { error: "Invalid email or password" };
  }

  await createSession(user);
  redirect("/app");
}

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  if (!email || !password || !name) {
    return { error: "All fields required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  try {
    const user = await createUser(email, password, name, "connector");
    await createSession(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("duplicate") || message.includes("unique")) {
      return { error: "An account with that email already exists" };
    }
    return { error: "Failed to create account" };
  }

  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  redirect("/app/login");
}

export async function createLeadAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const lead_name = String(formData.get("lead_name") || "").trim();
  const lead_email = String(formData.get("lead_email") || "").trim();
  const lead_linkedin = String(formData.get("lead_linkedin") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const company_website = String(formData.get("company_website") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const vendor = String(formData.get("vendor") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const why_fit = String(formData.get("why_fit") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!lead_name || !company) {
    return { error: "Lead name and company are required" };
  }

  const rows = await query<{ id: number }>(
    `INSERT INTO leads (owner_id, lead_name, lead_email, lead_linkedin, company, company_website, title, vendor, category, why_fit, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'submitted') RETURNING id`,
    [
      session.id,
      lead_name,
      lead_email || null,
      lead_linkedin || null,
      company,
      company_website || null,
      title || null,
      vendor || null,
      category || null,
      why_fit || null,
      notes || null,
    ]
  );

  const leadId = rows[0]?.id;
  if (leadId) {
    await query(
      `INSERT INTO lead_events (lead_id, actor_id, event_type, to_status, note) VALUES ($1,$2,'created','submitted',$3)`,
      [leadId, session.id, `Lead submitted by ${session.name}`]
    );
  }

  revalidatePath("/app");
  redirect(`/app/leads/${leadId}`);
}

export async function updateLeadStatusAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const leadId = Number(formData.get("lead_id"));
  const newStatus = String(formData.get("status") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!leadId || !newStatus) return { error: "Missing fields" };

  // Only owner or admin can update
  const lead = await query<{ owner_id: number; status: string }>(
    "SELECT owner_id, status FROM leads WHERE id = $1",
    [leadId]
  );
  if (!lead[0]) return { error: "Lead not found" };
  if (session.role !== "admin" && lead[0].owner_id !== session.id) {
    return { error: "Not authorized" };
  }

  const fromStatus = lead[0].status;

  await query(
    "UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2",
    [newStatus, leadId]
  );

  await query(
    `INSERT INTO lead_events (lead_id, actor_id, event_type, from_status, to_status, note)
     VALUES ($1,$2,'status_change',$3,$4,$5)`,
    [leadId, session.id, fromStatus, newStatus, note || null]
  );

  revalidatePath(`/app/leads/${leadId}`);
  revalidatePath("/app");
  return { success: true };
}

const ALLOWED_STATUSES = [
  "submitted",
  "pending_optin",
  "vendor_interested",
  "intro_sent",
  "meeting_booked",
  "qualified",
  "closed_won",
  "paid",
  "rejected",
  "cancelled",
];

export async function bulkImportLeadsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const rowsJson = String(formData.get("rows") || "");
  const defaultOwnerId = Number(formData.get("default_owner_id"));
  if (!defaultOwnerId) return { error: "Default owner required" };

  let rows: Record<string, string>[];
  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return { error: "Invalid rows data" };
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "No rows to import" };
  }

  // Build email -> user_id lookup
  const users = await query<{ id: number; email: string }>(
    "SELECT id, lower(email) AS email FROM users"
  );
  const emailToId = new Map(users.map((u) => [u.email, u.id]));

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const leadName = (row.lead_name || "").trim();
    const company = (row.company || "").trim();
    if (!leadName || !company) {
      skipped++;
      continue;
    }

    let ownerId = defaultOwnerId;
    const ownerEmail = (row.owner_email || "").trim().toLowerCase();
    if (ownerEmail) {
      const matched = emailToId.get(ownerEmail);
      if (matched) ownerId = matched;
    }

    const status = ALLOWED_STATUSES.includes(row.status)
      ? row.status
      : "submitted";

    const inserted_rows = await query<{ id: number }>(
      `INSERT INTO leads (owner_id, lead_name, lead_email, lead_linkedin, company, company_website, title, vendor, category, why_fit, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [
        ownerId,
        leadName,
        row.lead_email || null,
        row.lead_linkedin || null,
        company,
        row.company_website || null,
        row.title || null,
        row.vendor || null,
        row.category || null,
        row.why_fit || null,
        row.notes || null,
        status,
      ]
    );

    const leadId = inserted_rows[0]?.id;
    if (leadId) {
      await query(
        `INSERT INTO lead_events (lead_id, actor_id, event_type, to_status, note) VALUES ($1,$2,'created',$3,$4)`,
        [leadId, session.id, status, `Imported by ${session.name}`]
      );
      inserted++;
    }
  }

  revalidatePath("/app/admin");
  return { inserted, skipped };
}

export async function updateCommissionRateAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const userId = Number(formData.get("user_id"));
  const rateRaw = Number(formData.get("rate"));
  if (!userId || Number.isNaN(rateRaw)) return { error: "Invalid input" };

  // Accept either 0.3 or 30 — store as decimal 0-1
  const rate = rateRaw > 1 ? rateRaw / 100 : rateRaw;
  if (rate < 0 || rate > 1) return { error: "Rate must be between 0 and 100%" };

  await query(`UPDATE users SET commission_rate = $1 WHERE id = $2`, [
    rate,
    userId,
  ]);

  revalidatePath("/app/admin");
  return { success: true };
}

export async function addNoteAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");

  const leadId = Number(formData.get("lead_id"));
  const note = String(formData.get("note") || "").trim();

  if (!leadId || !note) return { error: "Missing fields" };

  await query(
    `INSERT INTO lead_events (lead_id, actor_id, event_type, note) VALUES ($1,$2,'note',$3)`,
    [leadId, session.id, note]
  );

  revalidatePath(`/app/leads/${leadId}`);
  return { success: true };
}
