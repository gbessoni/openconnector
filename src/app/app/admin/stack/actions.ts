"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function markIntrosSentAction(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) redirect("/app/login");
  if (session.role !== "admin") return { error: "Admin only" };

  const leadId = Number(formData.get("lead_id"));
  if (!leadId) return { error: "Missing lead ID" };

  await query(
    `UPDATE stack_leads SET status = 'intros_sent', updated_at = NOW() WHERE id = $1`,
    [leadId]
  );

  revalidatePath("/app/admin/stack");
  return { success: true };
}
