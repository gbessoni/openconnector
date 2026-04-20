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
