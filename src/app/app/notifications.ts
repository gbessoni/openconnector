"use server";

import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export interface AdminNotificationCounts {
  stackLeads: number;   // Stack leads with status='meetings_selected' awaiting cal link
  hunters: number;      // Hunter signups pending payment or new
  applications: number; // Connector applications pending review
}

export async function getAdminNotificationCounts(): Promise<AdminNotificationCounts> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { stackLeads: 0, hunters: 0, applications: 0 };
  }

  const rows = await query<{
    stack_leads: number;
    hunters: number;
    applications: number;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM stack_leads WHERE status = 'meetings_selected') AS stack_leads,
       (SELECT COUNT(*)::int FROM hunter_signups WHERE status IN ('pending','checkout_sent')) AS hunters,
       (SELECT COUNT(*)::int FROM connector_applications WHERE status = 'pending') AS applications
    `
  );

  const r = rows[0];
  return {
    stackLeads: r?.stack_leads ?? 0,
    hunters: r?.hunters ?? 0,
    applications: r?.applications ?? 0,
  };
}
