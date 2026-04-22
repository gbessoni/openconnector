"use server";

import { headers } from "next/headers";
import { query, queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getStripe, HUNTER_PRICE_ID, siteUrl } from "@/lib/stripe";
import { sendCAPIEvent } from "@/lib/meta-capi";

function randomPassword(len = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export interface HunterSignupPayload {
  name: string;
  email: string;
  linkedin?: string;
  phone?: string;
  background?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
}

export async function submitHunterSignupAction(
  formData: FormData
): Promise<{ success: true; id: number } | { error: string }> {
  const get = (k: string) => String(formData.get(k) || "").trim();

  const payload: HunterSignupPayload = {
    name: get("name"),
    email: get("email"),
    linkedin: get("linkedin") || undefined,
    phone: get("phone") || undefined,
    background: get("background") || undefined,
    utm_source: get("utm_source") || undefined,
    utm_medium: get("utm_medium") || undefined,
    utm_campaign: get("utm_campaign") || undefined,
    utm_content: get("utm_content") || undefined,
    utm_term: get("utm_term") || undefined,
    referrer: get("referrer") || undefined,
  };

  if (!payload.name) return { error: "Full name is required." };
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { error: "Valid email required." };
  }

  // Check duplicate
  const existing = await queryOne<{ id: number; status: string }>(
    `SELECT id, status FROM hunter_signups
     WHERE lower(email) = lower($1)
       AND status NOT IN ('cancelled','refunded')
     LIMIT 1`,
    [payload.email]
  );
  if (existing) {
    return { error: "You're already signed up. Check your email for access." };
  }

  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO hunter_signups
      (name, email, linkedin, phone, background,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      payload.name,
      payload.email.toLowerCase(),
      payload.linkedin || null,
      payload.phone || null,
      payload.background || null,
      payload.utm_source || null,
      payload.utm_medium || null,
      payload.utm_campaign || null,
      payload.utm_content || null,
      payload.utm_term || null,
      payload.referrer || null,
    ]
  );
  if (!inserted) return { error: "Failed to save signup." };

  // Find or create a user record so they can actually log into /app.
  // Hunter signups are free and instant — no approval step, unlike
  // connector_applications. If the email already has a user (e.g. they
  // were approved earlier via the Referral Partner flow), link to that
  // existing row instead of creating a duplicate.
  const emailLower = payload.email.toLowerCase();
  const existingUser = await queryOne<{ id: number }>(
    `SELECT id FROM users WHERE lower(email) = $1`,
    [emailLower]
  );

  let userId: number;
  let tempPassword: string | null = null;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    tempPassword = randomPassword(12);
    const hash = await hashPassword(tempPassword);
    const created = await queryOne<{ id: number }>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'connector') RETURNING id`,
      [emailLower, hash, payload.name]
    );
    if (!created) {
      return { error: "Failed to create user account." };
    }
    userId = created.id;
  }

  // Mark active + link the hunter signup to the user account
  await query(
    `UPDATE hunter_signups
     SET status = 'active', created_user_id = $1, updated_at = NOW()
     WHERE id = $2`,
    [userId, inserted.id]
  );

  // Fire Day 0 welcome email with credentials
  try {
    const { sendHunterWelcomeEmail } = await import("@/lib/hunter-emails");
    await sendHunterWelcomeEmail(inserted.id, tempPassword);
  } catch (e) {
    console.error("Failed to send hunter welcome email", e);
  }

  // Fire Meta CAPI Lead event (server-side — no-ops if token missing)
  try {
    const h = await headers();
    const clientIp =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      undefined;
    const userAgent = h.get("user-agent") || undefined;
    const fbclid = String(formData.get("fbclid") || "") || undefined;
    const fbp = String(formData.get("fbp") || "") || undefined;

    const [firstName, ...rest] = payload.name.trim().split(/\s+/);
    await sendCAPIEvent({
      eventName: "Lead",
      eventId: String(inserted.id), // must match client-side fbq eventID
      email: emailLower,
      firstName,
      lastName: rest.join(" ") || undefined,
      fbclid,
      fbp,
      clientIp,
      userAgent,
      eventSourceUrl: `${siteUrl()}/hunter`,
      value: 49,
      currency: "USD",
    });
  } catch (e) {
    console.error("CAPI Lead failed (hunter signup)", e);
  }

  // Email Greg
  const resendKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (resendKey && notificationEmail) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);

      const utm = [
        payload.utm_source && `source: ${payload.utm_source}`,
        payload.utm_medium && `medium: ${payload.utm_medium}`,
        payload.utm_campaign && `campaign: ${payload.utm_campaign}`,
        payload.utm_content && `content: ${payload.utm_content}`,
        payload.utm_term && `term: ${payload.utm_term}`,
      ]
        .filter(Boolean)
        .join(" · ");

      await resend.emails.send({
        from: "Leapify Hunter <onboarding@resend.dev>",
        to: notificationEmail,
        subject: `🏹 New free Hunter signup: ${payload.name}`,
        html: `
          <h2>New Hunter signup (free tier)</h2>
          <p><strong>${payload.name}</strong> just signed up for Hunter.</p>
          <hr>
          <p><strong>Email:</strong> ${payload.email}</p>
          ${payload.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${payload.linkedin}">${payload.linkedin}</a></p>` : ""}
          ${payload.phone ? `<p><strong>Phone:</strong> ${payload.phone}</p>` : ""}
          ${payload.background ? `<p><strong>Background:</strong> ${payload.background}</p>` : ""}
          ${utm ? `<p><strong>UTM:</strong> ${utm}</p>` : ""}
          ${payload.referrer ? `<p><strong>Referrer:</strong> ${payload.referrer}</p>` : ""}
          <hr>
          <p>Welcome email already sent. Status: <strong>active</strong>.</p>
          <p><a href="${siteUrl()}/app/admin/hunters">View in admin →</a></p>
          <p><small>Signup ID: ${inserted.id}.</small></p>
        `,
      });
    } catch (e) {
      console.error("Failed to send hunter admin notification", e);
    }
  }

  // Silence unused imports lint
  void getStripe;
  void HUNTER_PRICE_ID;

  return { success: true, id: inserted.id };
}
