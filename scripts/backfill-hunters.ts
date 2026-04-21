// Standalone backfill — creates user accounts for hunter_signups that
// never got one, and emails them credentials.
// Execute via: npx tsx scripts/backfill-hunters.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function randomPassword(len = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

const SITE = "https://www.leapify.xyz";

function welcomeHtml(firstName: string, email: string, tempPassword: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;max-width:560px">
      <h1 style="font-size:24px;margin:0 0 20px">Hey ${firstName} — here's your Hunter login.</h1>
      <p>Quick heads up: my welcome email last time didn't include your login. My mistake. Here it is:</p>
      <div style="background:#f5f5f5;border-left:3px solid #00aa5e;padding:14px 18px;margin:20px 0;font-size:14px">
        <div style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Your login</div>
        <div><strong>Email:</strong> ${email}</div>
        <div><strong>Temporary password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;font-size:14px">${tempPassword}</code></div>
        <div style="color:#666;font-size:12px;margin-top:6px">Change it after you log in.</div>
      </div>
      <ol>
        <li><strong>Log in</strong> → <a href="${SITE}/app/login" style="color:#00aa5e;font-weight:600">leapify.xyz/app/login</a></li>
        <li><strong>Browse Companies</strong> — 57 vetted vendors with ICP + payout</li>
        <li><strong>Pick 2-3 where you already know the ICP</strong></li>
        <li><strong>Submit an intro</strong> — I handle the rest, you earn 30% when it closes</li>
      </ol>
      <p>Sorry for the detour. Reply to this email anytime.</p>
      <p style="margin-top:24px"><strong>— Greg</strong></p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0" />
      <p style="color:#888;font-size:12px">Greg Bessoni · Leapify · <a href="mailto:greg@parkingaccess.com" style="color:#0066cc">greg@parkingaccess.com</a></p>
    </div>`;
}

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not loaded from .env.local");
    process.exit(1);
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const orphans = await pool.query<{ id: number; name: string; email: string }>(
    `SELECT h.id, h.name, h.email
     FROM hunter_signups h
     WHERE NOT EXISTS (
       SELECT 1 FROM users u WHERE lower(u.email) = lower(h.email)
     )
     AND h.status NOT IN ('cancelled', 'refunded')
     ORDER BY h.created_at ASC`
  );

  console.log(`Found ${orphans.rows.length} hunter signups without user accounts.\n`);

  for (const h of orphans.rows) {
    const emailLower = h.email.toLowerCase();
    const tempPw = randomPassword(12);
    const hash = await bcrypt.hash(tempPw, 10);

    const created = await pool.query<{ id: number }>(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'connector') RETURNING id`,
      [emailLower, hash, h.name]
    );
    const userId = created.rows[0].id;

    await pool.query(
      `UPDATE hunter_signups SET created_user_id = $1, updated_at = NOW() WHERE id = $2`,
      [userId, h.id]
    );

    const firstName = h.name.split(" ")[0] || h.name;
    try {
      const result = await resend.emails.send({
        from: "Greg @ Leapify <onboarding@resend.dev>",
        replyTo: "greg@parkingaccess.com",
        to: h.email,
        subject: "Your Leapify Hunter login (re-send)",
        html: welcomeHtml(firstName, emailLower, tempPw),
      });
      console.log(
        `✓ ${h.email} — user ${userId}, temp pw '${tempPw}', resend id ${result.data?.id ?? "?"}`
      );
    } catch (e) {
      console.error(`✗ ${h.email}:`, e);
    }
  }

  await pool.end();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
