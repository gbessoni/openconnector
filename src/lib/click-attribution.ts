// Click attribution — captures gclid/fbclid/etc on landing and persists
// them for up to 90 days so conversions that happen on later visits
// (different session, closed tab, etc) still get attributed to the
// original click.

const CLICK_ID_KEY = "leapify_click_id";
const CLICK_ID_TTL_DAYS = 90;

export interface StoredClickId {
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  vendor?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  capturedAt: number; // epoch ms
}

const TRACKED_KEYS: (keyof StoredClickId)[] = [
  "gclid",
  "fbclid",
  "msclkid",
  "ttclid",
  "vendor",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

/**
 * Read attribution params from the current URL and persist to localStorage.
 * Safe to call on every page load — only writes when at least one param
 * is present, so subsequent visits don't overwrite stored attribution.
 */
export function captureClickIds(): void {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const incoming: StoredClickId = { capturedAt: Date.now() };
    let hasAny = false;

    for (const k of TRACKED_KEYS) {
      const v = url.searchParams.get(k);
      if (v) {
        (incoming as unknown as Record<string, unknown>)[k] = v;
        hasAny = true;
      }
    }

    if (hasAny) {
      localStorage.setItem(CLICK_ID_KEY, JSON.stringify(incoming));
    }
  } catch {
    // localStorage may be blocked (private mode, etc) — fail silently
  }
}

/**
 * Read persisted attribution. Returns null if nothing stored or entry is stale.
 */
export function getStoredClickIds(): StoredClickId | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(CLICK_ID_KEY);
    if (!raw) return null;
    const parsed: StoredClickId = JSON.parse(raw);
    const ageMs = Date.now() - parsed.capturedAt;
    if (ageMs > CLICK_ID_TTL_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(CLICK_ID_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
