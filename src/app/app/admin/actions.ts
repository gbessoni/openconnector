"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

// ─── Delete a Stack lead ────────────────────────────────────────
// lead_events has ON DELETE CASCADE so they go with it.
export async function deleteStackLeadAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const id = Number(formData.get("lead_id"));
  if (!id) return { error: "Missing lead ID" };

  await query(`DELETE FROM stack_leads WHERE id = $1`, [id]);
  revalidatePath("/app/admin/stack");
  return { success: true };
}

// ─── Delete a Hunter signup ─────────────────────────────────────
// hunter_email_sends has ON DELETE CASCADE so drip history goes too.
// The linked user account is NOT deleted here — use deleteUserAction
// for that (two-step delete to avoid wiping someone who also has
// submitted leads or an approved application).
export async function deleteHunterAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const id = Number(formData.get("hunter_id"));
  if (!id) return { error: "Missing hunter ID" };

  await query(`DELETE FROM hunter_signups WHERE id = $1`, [id]);
  revalidatePath("/app/admin/hunters");
  revalidatePath("/app/admin");
  return { success: true };
}

// ─── Delete a user (connector) ──────────────────────────────────
// Safety: never delete admins. Refuse to delete if the user owns
// submitted leads — admin must clean those up first (or reassign
// ownership). Null out soft FK refs (lead_events.actor_id, reviewer_id)
// so related history survives.
export async function deleteUserAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const id = Number(formData.get("user_id"));
  if (!id) return { error: "Missing user ID" };
  if (id === session.id) {
    return { error: "You can't delete yourself." };
  }

  const target = await queryOne<{ id: number; role: string; email: string }>(
    `SELECT id, role, email FROM users WHERE id = $1`,
    [id]
  );
  if (!target) return { error: "User not found" };
  if (target.role === "admin") {
    return { error: "Can't delete admin accounts." };
  }

  // Block deletion if they own leads — forces admin to decide explicitly
  const leadsRow = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM leads WHERE owner_id = $1`,
    [id]
  );
  if ((leadsRow?.count ?? 0) > 0) {
    return {
      error: `User has ${leadsRow!.count} lead(s). Reassign or delete those first.`,
    };
  }

  // Null out the soft FKs first so cascading FKs don't fail
  await query(`UPDATE lead_events SET actor_id = NULL WHERE actor_id = $1`, [id]);
  await query(
    `UPDATE connector_applications SET reviewer_id = NULL WHERE reviewer_id = $1`,
    [id]
  );
  await query(
    `UPDATE connector_applications SET created_user_id = NULL WHERE created_user_id = $1`,
    [id]
  );
  await query(
    `UPDATE hunter_signups SET created_user_id = NULL WHERE created_user_id = $1`,
    [id]
  );

  await query(`DELETE FROM users WHERE id = $1`, [id]);

  revalidatePath("/app/admin");
  return { success: true };
}
