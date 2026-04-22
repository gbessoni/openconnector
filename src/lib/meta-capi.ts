// Server-side Meta Conversions API.
//
// iOS 14+ and ad blockers strip 30-50% of client-side Pixel events. CAPI
// fires the same events from our server direct to Meta, with the same
// eventID as the client-side Pixel fire so Meta de-duplicates them.
//
// Falls back to a no-op if META_CAPI_TOKEN isn't set (local dev, missing
// config, etc.) so nothing crashes the request flow.

import bizSdk from "facebook-nodejs-business-sdk";
import crypto from "crypto";

const { ServerEvent, EventRequest, UserData, CustomData } = bizSdk;

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1465144761822206";

function sha256(s: string): string {
  return crypto
    .createHash("sha256")
    .update(s.trim().toLowerCase())
    .digest("hex");
}

export interface CAPIPayload {
  eventName: "Lead" | "Subscribe" | "Purchase" | "InitiateCheckout" | "ViewContent";
  eventId: string; // must match the client-side Pixel eventID for dedup
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fbclid?: string;
  fbp?: string; // from `_fbp` cookie
  fbc?: string; // `fb.1.<timestamp>.<fbclid>`
  clientIp?: string;
  userAgent?: string;
  eventSourceUrl: string;
  value?: number;
  currency?: string;
  orderId?: string;
  // Optional test event code for staging verification in Meta's Test Events tab
  testEventCode?: string;
}

export async function sendCAPIEvent(p: CAPIPayload): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    // Silent no-op in dev or when not configured
    return;
  }

  try {
    const userData = new UserData();
    if (p.email) userData.setEmails([sha256(p.email)]);
    if (p.phone) {
      const digits = p.phone.replace(/[^0-9+]/g, "");
      if (digits) userData.setPhones([sha256(digits)]);
    }
    if (p.firstName) userData.setFirstNames([sha256(p.firstName)]);
    if (p.lastName) userData.setLastNames([sha256(p.lastName)]);
    if (p.fbp) userData.setFbp(p.fbp);
    if (p.fbc) {
      userData.setFbc(p.fbc);
    } else if (p.fbclid) {
      userData.setFbc(`fb.1.${Date.now()}.${p.fbclid}`);
    }
    if (p.clientIp) userData.setClientIpAddress(p.clientIp);
    if (p.userAgent) userData.setClientUserAgent(p.userAgent);

    const customData = new CustomData();
    if (p.value !== undefined) customData.setValue(p.value);
    if (p.currency) customData.setCurrency(p.currency);
    if (p.orderId) customData.setOrderId(p.orderId);

    const event = new ServerEvent()
      .setEventName(p.eventName)
      .setEventTime(Math.floor(Date.now() / 1000))
      .setEventId(p.eventId)
      .setEventSourceUrl(p.eventSourceUrl)
      .setActionSource("website")
      .setUserData(userData)
      .setCustomData(customData);

    const request = new EventRequest(token, PIXEL_ID).setEvents([event]);
    if (p.testEventCode) request.setTestEventCode(p.testEventCode);
    await request.execute();
  } catch (e) {
    console.error("Meta CAPI event failed:", p.eventName, p.eventId, e);
  }
}
