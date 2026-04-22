// Backfills vendors.primary_buyer for all rows where it's currently null.
// Uses Claude Haiku to extract 3-6 decision-maker titles per vendor from
// their ICP + description text. Output format matches existing hand-entered
// vendors (one title per line, Title Case, e.g. "Head of Finance").
//
// Run with: npx tsx scripts/backfill-primary-buyer.ts
//           npx tsx scripts/backfill-primary-buyer.ts --dry-run

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";
const DRY_RUN = process.argv.includes("--dry-run");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You extract primary buyer titles from vendor descriptions.

"Primary buyer" = the decision-maker who would actually evaluate this product and sign off on the purchase. Not end users, not influencers — the economic buyer.

Return 3–6 titles, one per line, Title Case. Examples of good formatting:
  CFO
  Head of Finance / Fractional CFO
  VP of Engineering
  Founder / CEO
  Head of Ops

Rules:
- Use the slash " / " to combine synonymous titles (e.g. "Founder / CEO").
- No bullets, numbers, quotes, or commentary.
- No trailing whitespace or explanations.
- Output ONLY the titles, one per line. Nothing else.`;

interface Vendor {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  icp: string | null;
  target_industries: string | null;
}

async function extractTitles(v: Vendor): Promise<string | null> {
  const user = `Vendor: ${v.name}
Category: ${v.category ?? "—"}
Target industries: ${v.target_industries ?? "—"}

Description: ${v.description ?? "—"}

ICP: ${v.icp ?? "—"}

Extract the primary buyer titles.`;

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 200,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    });

    const textBlock = res.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    // Strip markdown fences / stray chars, normalize lines
    const raw = textBlock.text.trim();
    const lines = raw
      .split(/\n/)
      .map((l) =>
        l
          .replace(/^```.*$/gm, "")
          .replace(/^[-•*\d\.\)]\s*/, "")
          .trim()
      )
      .filter(Boolean)
      .slice(0, 6);

    if (lines.length === 0) return null;
    return lines.join("\n");
  } catch (e) {
    console.error(`  Claude call failed for ${v.slug}:`, e);
    return null;
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const rows = await pool.query<Vendor>(
    `SELECT id, slug, name, category, description, icp, target_industries
     FROM vendors
     WHERE status = 'active'
       AND (primary_buyer IS NULL OR primary_buyer = '')
     ORDER BY name ASC`
  );

  console.log(
    `Found ${rows.rows.length} vendors needing primary_buyer${DRY_RUN ? " (DRY RUN)" : ""}.\n`
  );

  let success = 0;
  let failure = 0;

  for (const v of rows.rows) {
    const titles = await extractTitles(v);
    if (!titles) {
      console.log(`  ✗ ${v.slug} — no titles extracted`);
      failure++;
      continue;
    }

    const preview = titles.replace(/\n/g, " · ");
    console.log(`  ✓ ${v.slug}: ${preview}`);

    if (!DRY_RUN) {
      await pool.query(
        `UPDATE vendors SET primary_buyer = $1, updated_at = NOW() WHERE id = $2`,
        [titles, v.id]
      );
    }
    success++;
  }

  await pool.end();
  console.log(
    `\nDone. ${success} succeeded, ${failure} failed.${DRY_RUN ? " (DRY RUN — nothing written)" : ""}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
