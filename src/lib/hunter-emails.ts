import { query, queryOne } from "./db";

export const SEQUENCE_KEYS = {
  DAY_0_WELCOME: "day_0_welcome",
  DAY_2_FIRST_PITCH: "day_2_first_pitch",
  DAY_5_LEADERBOARD: "day_5_leaderboard",
  DAY_14_CHECKIN: "day_14_checkin",
  DAY_28_GUARANTEE: "day_28_guarantee",
} as const;

export type SequenceKey = (typeof SEQUENCE_KEYS)[keyof typeof SEQUENCE_KEYS];

interface HunterForEmail {
  id: number;
  name: string;
  email: string;
  last_paid_at: string | null;
  status: string;
}

async function alreadySent(
  hunterId: number,
  key: SequenceKey
): Promise<boolean> {
  const row = await queryOne(
    `SELECT 1 FROM hunter_email_sends WHERE hunter_signup_id = $1 AND sequence_key = $2`,
    [hunterId, key]
  );
  return !!row;
}

async function recordSent(
  hunterId: number,
  key: SequenceKey,
  resendId: string | null
): Promise<void> {
  await query(
    `INSERT INTO hunter_email_sends (hunter_signup_id, sequence_key, resend_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (hunter_signup_id, sequence_key) DO NOTHING`,
    [hunterId, key, resendId]
  );
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<string | null> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return null;
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: "Greg @ Leapify <onboarding@resend.dev>",
      replyTo: "greg@parkingaccess.com",
      to,
      subject,
      html,
    });
    return result.data?.id ?? null;
  } catch (e) {
    console.error("Failed to send hunter drip email", e);
    return null;
  }
}

const SITE = "https://www.leapify.xyz";

const FOOTER = `
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0" />
  <p style="color:#888;font-size:12px">
    Greg Bessoni · Leapify · <a href="mailto:greg@parkingaccess.com" style="color:#0066cc">greg@parkingaccess.com</a><br>
    Reply anytime. These emails are real — this inbox is monitored.
  </p>
`;

// ─────────────────────────────────────────────────────────────
// Email templates
// ─────────────────────────────────────────────────────────────

function welcomeHtml(firstName: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;max-width:560px">
      <h1 style="font-size:24px;margin:0 0 20px">Welcome to Hunter, ${firstName}.</h1>
      <p>You're in. Here's exactly what to do in the next 48 hours:</p>
      <ol>
        <li><strong>Log into the platform</strong> → <a href="${SITE}/app/login" style="color:#00aa5e;font-weight:600">leapify.xyz/app/login</a>. You'll get a separate email with login credentials.</li>
        <li><strong>Review the vendor list</strong>. Pick 3-5 where you already know the ICP. That's where your first intros come from.</li>
        <li><strong>Check your inbox in 2 days</strong> — I'll send the first pitch template.</li>
      </ol>
      <p>One thing that matters: hunters who close in month 1 are the ones who pick <em>3 vendors</em> and focus. Don't try to pitch all 57.</p>
      <p style="margin-top:24px"><strong>— Greg</strong></p>
      ${FOOTER}
    </div>`;
}

function firstPitchHtml(firstName: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;max-width:560px">
      <h1 style="font-size:24px;margin:0 0 20px">${firstName}, here's your first pitch template.</h1>
      <p>Copy this. Change 3 words. Send it to one person in your network today.</p>
      <div style="background:#f5f5f5;border-left:3px solid #00aa5e;padding:16px 20px;margin:20px 0;font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#333">
        Hey [Name] — quick one.<br><br>
        I'm part of a warm-intro network called Leapify. We work with [Vendor Name], and based on [what you know about their business], I think it could be a real fit.<br><br>
        Vendor pays $[X] for qualified intros. Want me to send over the 1-pager and set up a call?<br><br>
        No pressure — just flagging in case the timing's right.
      </div>
      <p><strong>The move:</strong> Pick ONE vendor from the platform. Pick ONE person in your network who fits their ICP. Send it. That's it for today.</p>
      <p>Log into the platform to see every vendor's exact ICP + recommended message:</p>
      <p><a href="${SITE}/app/companies" style="display:inline-block;background:#00aa5e;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Browse vendors →</a></p>
      <p style="margin-top:24px"><strong>— Greg</strong></p>
      ${FOOTER}
    </div>`;
}

function leaderboardHtml(firstName: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;max-width:560px">
      <h1 style="font-size:24px;margin:0 0 20px">${firstName}, here's what top hunters are doing.</h1>
      <p>A few patterns from our top earners:</p>
      <ul>
        <li><strong>They specialize.</strong> One hunter only does Finance + Banking intros. Made $2,100 in month 1. Focus beats breadth.</li>
        <li><strong>They send 3 intros/day, not 30.</strong> Every intro is hand-picked. Quality over volume.</li>
        <li><strong>They use LinkedIn DMs, not email.</strong> Reply rates are 4x higher.</li>
      </ul>
      <p>If you've sent 5+ intros this week, you're on track. If you haven't sent any — reply to this email and tell me what's blocking you. I'll help.</p>
      <p style="margin-top:24px"><strong>— Greg</strong></p>
      ${FOOTER}
    </div>`;
}

function checkinHtml(firstName: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;max-width:560px">
      <h1 style="font-size:24px;margin:0 0 20px">${firstName}, 2 weeks in.</h1>
      <p>Real question: how's it going?</p>
      <p>Three honest options — reply with one number:</p>
      <ol>
        <li><strong>Sending intros, feeling good.</strong> Keep going, I won't bother you.</li>
        <li><strong>Sending intros, no bites yet.</strong> I'll look at your pitches and tell you what to tweak.</li>
        <li><strong>Haven't sent anything.</strong> Tell me what's blocking you. We'll fix it.</li>
      </ol>
      <p>Don't be shy. Everyone gets stuck. The ones who email back are the ones who end up earning.</p>
      <p style="margin-top:24px"><strong>— Greg</strong></p>
      ${FOOTER}
    </div>`;
}

function guaranteeHtml(firstName: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;max-width:560px">
      <h1 style="font-size:24px;margin:0 0 20px">${firstName}, the 30-day guarantee.</h1>
      <p>Heads up — you're at day 30 of Hunter. Here's our promise:</p>
      <p><strong>If you haven't closed a qualified intro + meeting in your first 30 days, I send you one.</strong> That's the deal.</p>
      <p>Reply with either:</p>
      <ul>
        <li>"<strong>Send me my SQL.</strong>" — I'll hand-deliver a qualified lead with a meeting booked. No hoops.</li>
        <li>"<strong>I'm closing deals.</strong>" — Tell me about it. Let's talk about scaling.</li>
        <li>"<strong>Refund me.</strong>" — Full refund. No questions. Cancellation processed same day.</li>
      </ul>
      <p>I'm betting on you. You should bet on yourself. But the $49 doesn't go to waste either way.</p>
      <p style="margin-top:24px"><strong>— Greg</strong></p>
      ${FOOTER}
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

export async function sendHunterWelcomeEmail(hunterId: number): Promise<void> {
  const hunter = await queryOne<HunterForEmail>(
    `SELECT id, name, email, last_paid_at, status FROM hunter_signups WHERE id = $1`,
    [hunterId]
  );
  if (!hunter) return;

  if (await alreadySent(hunter.id, SEQUENCE_KEYS.DAY_0_WELCOME)) return;

  const firstName = hunter.name.split(" ")[0] || hunter.name;
  const id = await sendEmail(
    hunter.email,
    `Welcome to Hunter — start here`,
    welcomeHtml(firstName)
  );
  await recordSent(hunter.id, SEQUENCE_KEYS.DAY_0_WELCOME, id);
}

interface DripStep {
  key: SequenceKey;
  daysAfterPaid: number;
  subject: (firstName: string) => string;
  html: (firstName: string) => string;
}

const DRIP_STEPS: DripStep[] = [
  {
    key: SEQUENCE_KEYS.DAY_2_FIRST_PITCH,
    daysAfterPaid: 2,
    subject: (n) => `${n}, your first pitch template`,
    html: firstPitchHtml,
  },
  {
    key: SEQUENCE_KEYS.DAY_5_LEADERBOARD,
    daysAfterPaid: 5,
    subject: () => `What top hunters do differently`,
    html: leaderboardHtml,
  },
  {
    key: SEQUENCE_KEYS.DAY_14_CHECKIN,
    daysAfterPaid: 14,
    subject: (n) => `${n} — 2-week check-in`,
    html: checkinHtml,
  },
  {
    key: SEQUENCE_KEYS.DAY_28_GUARANTEE,
    daysAfterPaid: 28,
    subject: () => `Your 30-day SQL guarantee`,
    html: guaranteeHtml,
  },
];

/**
 * Process the drip sequence. Called by cron daily.
 * Returns summary for logging.
 */
export async function processDripSequence(): Promise<{
  total_paid_hunters: number;
  sent_count: number;
  errors: number;
}> {
  // Find all hunters who are paid/active and have last_paid_at set
  const hunters = await query<HunterForEmail>(
    `SELECT id, name, email, last_paid_at, status
     FROM hunter_signups
     WHERE status IN ('paid','active')
       AND last_paid_at IS NOT NULL`
  );

  let sent = 0;
  let errors = 0;
  const now = Date.now();

  for (const h of hunters) {
    if (!h.last_paid_at) continue;
    const paidMs = new Date(h.last_paid_at).getTime();
    const daysSincePaid = Math.floor((now - paidMs) / (1000 * 60 * 60 * 24));

    for (const step of DRIP_STEPS) {
      if (daysSincePaid < step.daysAfterPaid) continue;
      if (await alreadySent(h.id, step.key)) continue;

      const firstName = h.name.split(" ")[0] || h.name;
      try {
        const id = await sendEmail(
          h.email,
          step.subject(firstName),
          step.html(firstName)
        );
        await recordSent(h.id, step.key, id);
        sent++;
      } catch (e) {
        console.error(`Drip failed for hunter ${h.id} step ${step.key}`, e);
        errors++;
      }
    }
  }

  return {
    total_paid_hunters: hunters.length,
    sent_count: sent,
    errors,
  };
}
