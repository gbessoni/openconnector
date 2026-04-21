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

// Convenience: production base URL for redirect URLs
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const v = process.env.VERCEL_URL;
  if (v) return v.startsWith("http") ? v : `https://${v}`;
  return "https://www.leapify.xyz";
}
