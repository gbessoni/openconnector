import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, {
    typescript: true,
  });
  return _stripe;
}

export const HUNTER_PRICE_ID = process.env.STRIPE_HUNTER_PRICE_ID || "";

// Canonical production URL for emails, redirects, etc.
// NEVER use VERCEL_URL here — that resolves to preview-specific URLs like
// superconnector-abc123.vercel.app which aren't the public alias.
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.leapify.xyz";
}
