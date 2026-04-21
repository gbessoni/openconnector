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

  const isAdmin = session.role === "admin";
  const rowsJson = String(formData.get("rows") || "");
  // Non-admins always import to themselves
  const defaultOwnerId = isAdmin
    ? Number(formData.get("default_owner_id"))
    : session.id;
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
    // Only admins can assign leads to other users via owner_email
    if (isAdmin) {
      const ownerEmail = (row.owner_email || "").trim().toLowerCase();
      if (ownerEmail) {
        const matched = emailToId.get(ownerEmail);
        if (matched) ownerId = matched;
      }
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

export async function searchProspectsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const vendorId = Number(formData.get("vendor_id"));
  if (!vendorId) return { error: "Missing vendor" };

  const titlesRaw = String(formData.get("titles") || "").trim();
  const countriesRaw = String(formData.get("countries") || "").trim();
  const sizesRaw = String(formData.get("company_sizes") || "").trim();
  const industriesRaw = String(formData.get("industries") || "").trim();
  const size = Math.min(Math.max(Number(formData.get("size")) || 25, 1), 100);

  const titles = titlesRaw
    ? titlesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const countries = countriesRaw
    ? countriesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const company_sizes = sizesRaw
    ? sizesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const industries = industriesRaw
    ? industriesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (titles.length === 0 && !titlesRaw) {
    return { error: "At least one title is required" };
  }

  const { searchPeople, toProspectInsert } = await import("@/lib/pdl");

  let result;
  try {
    result = await searchPeople({
      titles,
      countries,
      company_sizes,
      industries,
      size,
    });
  } catch (e) {
    console.error("PDL search failed", e);
    return { error: "PDL search failed — check server logs" };
  }

  if (result.status !== 200 && result.status !== 404) {
    return {
      error:
        result.error?.message ||
        `PDL returned status ${result.status}`,
    };
  }

  const people = result.data || [];
  let inserted = 0;
  let skipped = 0;

  for (const p of people) {
    const row = toProspectInsert(p);
    if (!row) {
      skipped++;
      continue;
    }
    try {
      await query(
        `INSERT INTO prospects
         (vendor_id, pdl_id, full_name, job_title, job_company_name, job_company_website,
          job_company_size, industry, linkedin_url, twitter_url, location_name, location_country,
          work_email_available, raw_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         ON CONFLICT (vendor_id, pdl_id) DO NOTHING`,
        [
          vendorId,
          row.pdl_id,
          row.full_name,
          row.job_title,
          row.job_company_name,
          row.job_company_website,
          row.job_company_size,
          row.industry,
          row.linkedin_url,
          row.twitter_url,
          row.location_name,
          row.location_country,
          row.work_email_available,
          JSON.stringify(row.raw_data),
        ]
      );
      inserted++;
    } catch (e) {
      console.error("Insert prospect failed", e);
      skipped++;
    }
  }

  // Get vendor slug to revalidate
  const vendorRow = await query<{ slug: string }>(
    `SELECT slug FROM vendors WHERE id = $1`,
    [vendorId]
  );
  if (vendorRow[0]?.slug) {
    revalidatePath(`/app/admin/vendors/${vendorRow[0].slug}/prospects`);
  }

  return { success: true, found: people.length, inserted, skipped, total: result.total };
}

export async function updateProspectStatusAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") || "").trim();
  const allowed = ["new", "queued", "contacted", "replied", "declined", "converted"];
  if (!id || !allowed.includes(status)) return { error: "Invalid input" };

  const extra =
    status === "contacted"
      ? ", contacted_at = NOW()"
      : status === "replied"
      ? ", replied_at = NOW()"
      : "";

  await query(
    `UPDATE prospects SET status = $1, updated_at = NOW() ${extra} WHERE id = $2`,
    [status, id]
  );

  return { success: true };
}

function randomPassword(len = 12): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function approveApplicationAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const appId = Number(formData.get("application_id"));
  if (!appId) return { error: "Missing application id" };

  const app = await query<{
    id: number;
    name: string;
    email: string;
    status: string;
    created_user_id: number | null;
  }>(
    `SELECT id, name, email, status, created_user_id FROM connector_applications WHERE id = $1`,
    [appId]
  );
  if (!app[0]) return { error: "Application not found" };
  if (app[0].status === "approved") {
    return { error: "Already approved" };
  }

  const email = app[0].email.trim().toLowerCase();

  // Check if user already exists
  const existing = await query<{ id: number }>(
    `SELECT id FROM users WHERE lower(email) = $1`,
    [email]
  );

  let userId: number;
  let tempPassword: string | null = null;

  if (existing[0]) {
    userId = existing[0].id;
  } else {
    // Create the user account
    const { hashPassword } = await import("@/lib/auth");
    tempPassword = randomPassword(12);
    const hash = await hashPassword(tempPassword);
    const created = await query<{ id: number }>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'connector') RETURNING id`,
      [email, hash, app[0].name]
    );
    userId = created[0].id;
  }

  // Update the application
  await query(
    `UPDATE connector_applications
     SET status = 'approved',
         reviewer_id = $1,
         reviewed_at = NOW(),
         created_user_id = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [session.id, userId, appId]
  );

  // Email the applicant
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const bodyParts: string[] = [
      `<h2>You're approved, ${app[0].name.split(" ")[0]}!</h2>`,
      `<p>You're now a Leapify referral partner. You can start submitting leads right away.</p>`,
      `<p><strong>Login:</strong> <a href="https://www.leapify.xyz/app/login">https://www.leapify.xyz/app/login</a></p>`,
      `<p><strong>Email:</strong> ${email}</p>`,
    ];
    if (tempPassword) {
      bodyParts.push(
        `<p><strong>Temporary password:</strong> <code>${tempPassword}</code></p>`,
        `<p>Log in and change your password under Settings.</p>`
      );
    } else {
      bodyParts.push(
        `<p>Your existing account password still works — just sign in.</p>`
      );
    }
    bodyParts.push(
      `<hr>`,
      `<p><small>Questions? Reply to this email.</small></p>`
    );

    try {
      await resend.emails.send({
        from: "Leapify <onboarding@resend.dev>",
        to: email,
        subject: "You're approved — welcome to Leapify",
        html: bodyParts.join("\n"),
      });
    } catch (e) {
      console.error("Failed to send approval email:", e);
    }
  }

  revalidatePath("/app/admin/applications");
  revalidatePath("/app/admin");
  return { success: true };
}

export async function declineApplicationAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const appId = Number(formData.get("application_id"));
  const note = String(formData.get("note") || "").trim() || null;
  if (!appId) return { error: "Missing application id" };

  await query(
    `UPDATE connector_applications
     SET status = 'declined',
         reviewer_id = $1,
         reviewed_at = NOW(),
         review_note = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [session.id, note, appId]
  );

  revalidatePath("/app/admin/applications");
  return { success: true };
}

export async function updateVendorAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const id = Number(formData.get("id"));
  if (!id) return { error: "Missing vendor ID" };

  const get = (k: string) => {
    const v = formData.get(k);
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };
  const getNum = (k: string) => {
    const s = get(k);
    if (s === null) return null;
    const n = parseFloat(s);
    return Number.isNaN(n) ? null : n;
  };

  const name = get("name");
  if (!name) return { error: "Name is required" };

  await query(
    `UPDATE vendors SET
      name = $1,
      category = $2,
      target_industries = $3,
      description = $4,
      long_description = $5,
      icp = $6,
      icp_bullets = $7,
      primary_buyer = $8,
      payout_text = $9,
      payout_amount = $10,
      commission_text = $11,
      commission_notes = $12,
      email = $13,
      website = $14,
      country = $15,
      updated_at = NOW()
     WHERE id = $16`,
    [
      name,
      get("category"),
      get("target_industries"),
      get("description"),
      get("long_description"),
      get("icp"),
      get("icp_bullets"),
      get("primary_buyer"),
      get("payout_text"),
      getNum("payout_amount"),
      get("commission_text"),
      get("commission_notes"),
      get("email"),
      get("website"),
      get("country"),
      id,
    ]
  );

  // Fetch the slug to revalidate its page
  const vendor = await query<{ slug: string }>(
    `SELECT slug FROM vendors WHERE id = $1`,
    [id]
  );
  if (vendor[0]?.slug) {
    revalidatePath(`/app/companies/${vendor[0].slug}`);
    revalidatePath(`/app/admin/vendors/${vendor[0].slug}`);
  }
  revalidatePath("/app/companies");

  return { success: true };
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
