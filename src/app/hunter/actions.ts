"use server";

import { query, queryOne } from "@/lib/db";
import { getStripe, HUNTER_PRICE_ID, siteUrl } from "@/lib/stripe";

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
): Promise<
  | { success: true; id: number; checkout_url?: string }
  | { error: string }
> {
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

  // Always notify admin even if Stripe isn't set up yet
  const resendKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;

  // Create Stripe Checkout Session
  let checkoutUrl: string | undefined;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (stripeKey && HUNTER_PRICE_ID) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: payload.email.toLowerCase(),
        line_items: [{ price: HUNTER_PRICE_ID, quantity: 1 }],
        success_url: `${siteUrl()}/hunter/thanks?signup_id=${inserted.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/hunter?cancelled=1`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            hunter_signup_id: String(inserted.id),
          },
        },
        metadata: {
          hunter_signup_id: String(inserted.id),
          utm_source: payload.utm_source || "",
          utm_campaign: payload.utm_campaign || "",
          background: payload.background || "",
        },
      });

      checkoutUrl = session.url || undefined;

      // Mark as checkout sent and store session id for webhook correlation
      await query(
        `UPDATE hunter_signups SET status = 'checkout_sent', updated_at = NOW() WHERE id = $1`,
        [inserted.id]
      );
    } catch (e) {
      console.error("Stripe checkout create failed", e);
      // Don't fail the whole flow — they'll get a manual follow-up email
      checkoutUrl = undefined;
    }
  }

  // Email Greg regardless
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
        subject: checkoutUrl
          ? `🎯 Hunter signup: ${payload.name} — checkout started`
          : `🎯 Hunter signup: ${payload.name} — needs manual checkout link`,
        html: `
          <h2>New Hunter signup</h2>
          <p><strong>${payload.name}</strong> wants to join the Hunter tier.</p>
          <hr>
          <p><strong>Email:</strong> ${payload.email}</p>
          ${payload.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${payload.linkedin}">${payload.linkedin}</a></p>` : ""}
          ${payload.phone ? `<p><strong>Phone:</strong> ${payload.phone}</p>` : ""}
          ${payload.background ? `<p><strong>Background:</strong> ${payload.background}</p>` : ""}
          ${utm ? `<p><strong>UTM:</strong> ${utm}</p>` : ""}
          ${payload.referrer ? `<p><strong>Referrer:</strong> ${payload.referrer}</p>` : ""}
          <hr>
          ${
            checkoutUrl
              ? `<p>✓ Stripe Checkout sent. Waiting on payment.</p>`
              : `<p><strong>⚠ Stripe not configured.</strong> Send them a manual checkout link.</p>`
          }
          <p><a href="${siteUrl()}/app/admin/hunters">View in admin →</a></p>
          <p><small>Signup ID: ${inserted.id}.</small></p>
        `,
      });
    } catch (e) {
      console.error("Failed to send hunter signup email", e);
    }
  }

  return { success: true, id: inserted.id, checkout_url: checkoutUrl };
}
