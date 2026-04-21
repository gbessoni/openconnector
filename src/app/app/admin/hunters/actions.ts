"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

const ALLOWED_STATUSES = [
  "pending",
  "checkout_sent",
  "paid",
  "active",
  "cancelled",
  "refunded",
];

export async function updateHunterStatusAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const id = Number(formData.get("hunter_id"));
  const status = String(formData.get("status") || "");

  if (!id) return { error: "Missing hunter ID" };
  if (!ALLOWED_STATUSES.includes(status))
    return { error: "Invalid status" };

  await query(
    `UPDATE hunter_signups SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id]
  );

  revalidatePath("/app/admin/hunters");
  return { success: true };
}

export async function updateHunterNotesAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const id = Number(formData.get("hunter_id"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!id) return { error: "Missing hunter ID" };

  await query(
    `UPDATE hunter_signups SET admin_notes = $1, updated_at = NOW() WHERE id = $2`,
    [notes, id]
  );

  revalidatePath("/app/admin/hunters");
  return { success: true };
}
