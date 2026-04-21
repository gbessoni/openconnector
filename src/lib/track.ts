// Client-side conversion tracking helpers
//
// Fires Google Ads conversions with enhanced conversions (user_data) for
// better match rates, plus GA4 + Meta Pixel events as available.

import { getStoredClickIds } from "./click-attribution";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface UserData {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export interface ConversionArgs {
  eventName: string;
  label: string;               // Conversion label, e.g. "VOwoCO_qoaAcEM6snps-"
  value?: number;
  currency?: string;
  transactionId?: string | number;
  user?: UserData;
}

function normalize(s?: string): string | undefined {
  if (!s) return undefined;
  return s.trim().toLowerCase();
}

function fullSendTo(label: string): string | null {
  if (label.startsWith("AW-")) return label; // already full
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (!adsId) return null;
  return `${adsId}/${label}`;
}

function setEnhancedConversionsUserData(user?: UserData): void {
  if (!user || typeof window === "undefined" || !window.gtag) return;
  const payload: Record<string, unknown> = {};
  const email = normalize(user.email);
  if (email) payload.email = email;
  const phone = user.phone?.replace(/[^0-9+]/g, "");
  if (phone) payload.phone_number = phone;
  if (user.first_name || user.last_name) {
    payload.address = {
      first_name: normalize(user.first_name),
      last_name: normalize(user.last_name),
    };
  }
  if (Object.keys(payload).length > 0) {
    try {
      window.gtag("set", "user_data", payload);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.warn("set user_data", e);
    }
  }
}

export function trackConversion(args: ConversionArgs): void {
  if (typeof window === "undefined") return;

  const { eventName, label, value = 0, currency = "USD", transactionId, user } = args;

  // Set enhanced-conversions user_data BEFORE firing the conversion
  setEnhancedConversionsUserData(user);

  // Google Ads (conversion)
  try {
    const sendTo = fullSendTo(label);
    if (window.gtag && sendTo) {
      window.gtag("event", "conversion", {
        send_to: sendTo,
        value,
        currency,
        transaction_id: transactionId ? String(transactionId) : undefined,
      });
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("trackConversion (ads)", e);
  }

  // GA4 event (if configured)
  try {
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag("event", eventName, {
        value,
        currency,
        transaction_id: transactionId ? String(transactionId) : undefined,
      });
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("trackConversion (ga4)", e);
  }

  // Meta Pixel Lead event
  try {
    if (window.fbq && process.env.NEXT_PUBLIC_META_PIXEL_ID) {
      window.fbq("track", "Lead", { value, currency });
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("trackConversion (fb)", e);
  }
}

// ─── Convenience wrappers for our two configured conversions ───

export function trackStackLead(args: {
  leadId: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  value?: number;
}): void {
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_STACK_LEAD_LABEL;
  if (!label) return;
  trackConversion({
    eventName: "stack_lead_submit",
    label,
    value: args.value ?? 50,
    currency: "USD",
    transactionId: args.leadId,
    user: {
      email: args.email,
      first_name: args.firstName,
      last_name: args.lastName,
    },
  });
}

export function trackHunterSignup(args: {
  signupId: number | string;
  email: string;
  firstName?: string;
  lastName?: string;
  value?: number;
}): void {
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_HUNTER_LABEL;
  if (!label) return;
  trackConversion({
    eventName: "hunter_signup",
    label,
    value: args.value ?? 49,
    currency: "USD",
    transactionId: args.signupId,
    user: {
      email: args.email,
      first_name: args.firstName,
      last_name: args.lastName,
    },
  });
}

// Expose stored click IDs to components that want to attach them to
// server-side payloads (so lead records have gclid)
export { getStoredClickIds };
