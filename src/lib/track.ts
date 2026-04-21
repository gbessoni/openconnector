// Client-side conversion tracking helpers
//
// Fire these on meaningful conversion events (lead submit, checkout, etc).
// If the ad platform isn't configured via env vars, calls are no-ops.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface ConversionArgs {
  eventName: string;
  value?: number;
  currency?: string;
  transactionId?: string | number;
  // If you create multiple conversion actions in Google Ads, pass the
  // specific label here (e.g. "AW-123/ABCxyz"). Falls back to env default.
  sendTo?: string;
}

/**
 * Fires a Google Ads conversion + GA4 event + Meta Pixel "Lead" event.
 * Safe to call even if tracking isn't installed — each check gates itself.
 */
export function trackConversion(args: ConversionArgs): void {
  if (typeof window === "undefined") return;

  const {
    eventName,
    value = 0,
    currency = "USD",
    transactionId,
    sendTo,
  } = args;

  // Google Ads (conversion)
  try {
    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    const label = sendTo || process.env.NEXT_PUBLIC_GOOGLE_ADS_STACK_LEAD_LABEL;
    if (window.gtag && adsId && label) {
      // label may be either "AW-ID/LABEL" or just "LABEL" — normalize
      const fullLabel = label.startsWith("AW-") ? label : `${adsId}/${label}`;
      window.gtag("event", "conversion", {
        send_to: fullLabel,
        value,
        currency,
        transaction_id: transactionId ? String(transactionId) : undefined,
      });
    }
  } catch (e) {
    // Never let tracking break the UX
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

export function trackPageView(path?: string): void {
  if (typeof window === "undefined") return;
  try {
    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!window.gtag) return;
    [adsId, gaId].filter(Boolean).forEach((id) => {
      window.gtag!("event", "page_view", {
        send_to: id,
        page_path: path,
      });
    });
  } catch {}
}
