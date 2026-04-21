import Anthropic from "@anthropic-ai/sdk";
import type { Vendor } from "./leads";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

const MODEL = "claude-haiku-4-5";

export interface StackPick {
  category: string;
  top_pick: {
    vendor_slug: string;
    reasoning: string;
  };
  alternative?: {
    vendor_slug: string;
    reasoning: string;
  } | null;
}

export interface StackResult {
  stack_title: string;
  slug_hint: string;
  inferred_profile: {
    company_type: string;
    stage: string;
    size: string;
    needs: string[];
  };
  picks: StackPick[];
  summary: string;
}

const SYSTEM_PROMPT = `You are a senior startup advisor for Leapify, a curated warm-introduction network run by Greg Bessoni. Given a user's company context, you recommend specific vendors from Leapify's curated list.

Rules you MUST follow:
1. Only recommend vendors from the list provided — never invent or suggest vendors not in the list.
2. Reference each vendor by its exact "slug" field.
3. Be opinionated, specific, and brief. Pretend you're texting a founder friend.
4. Use the vendor's own ICP and description to explain why the match fits the user's context.
5. Skip categories that don't apply to the user. Don't recommend payroll to a solo founder asking about banking.
6. For each picked category, include 1 top_pick and optionally 1 alternative.
7. Generate a catchy stack_title (e.g. "Series A B2B SaaS Starter Pack", "Solo Founder Cash Flow Stack").
8. Generate a URL-friendly slug_hint from the stack_title (lowercase, hyphens, no special chars).
9. Keep reasoning to 1-2 sentences per pick.
10. The inferred_profile should reflect what you inferred from the user's words, not restate them.

Return valid JSON matching this exact shape:
{
  "stack_title": "string",
  "slug_hint": "lowercase-with-hyphens",
  "inferred_profile": {
    "company_type": "string",
    "stage": "string",
    "size": "string",
    "needs": ["string"]
  },
  "picks": [
    {
      "category": "Banking",
      "top_pick": { "vendor_slug": "rho", "reasoning": "..." },
      "alternative": { "vendor_slug": "slash", "reasoning": "..." }
    }
  ],
  "summary": "1-2 sentence overview of the stack"
}`;

// Minimal vendor shape to send to the model — keeps token count low
interface VendorForModel {
  slug: string;
  name: string;
  category: string | null;
  target_industries: string | null;
  description: string | null;
  icp: string | null;
}

function stripVendor(v: Vendor): VendorForModel {
  return {
    slug: v.slug,
    name: v.name,
    category: v.category,
    target_industries: v.target_industries,
    description: v.description,
    icp: v.icp,
  };
}

export async function generateStack(
  userQuery: string,
  vendors: Vendor[]
): Promise<StackResult> {
  const client = getClient();

  const stripped = vendors.map(stripVendor);
  const vendorCatalog = JSON.stringify(stripped, null, 0);

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
      },
      {
        type: "text",
        text: `Leapify's curated vendor catalog (${stripped.length} vendors):\n\n${vendorCatalog}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Build me a stack based on this context:\n\n${userQuery}\n\nReturn only valid JSON. No markdown fences.`,
      },
    ],
  });

  // Extract text from first content block
  const textBlock = res.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in Claude response");
  }

  let raw = textBlock.text.trim();
  // Strip markdown fences if model added them despite instructions
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }

  let parsed: StackResult;
  try {
    parsed = JSON.parse(raw) as StackResult;
  } catch (e) {
    console.error("Failed to parse Claude response as JSON:", raw.slice(0, 500));
    throw new Error("Claude returned invalid JSON");
  }

  // Validate picks — drop any vendor_slug not in our DB
  const validSlugs = new Set(stripped.map((v) => v.slug));
  parsed.picks = (parsed.picks || [])
    .map((p) => {
      const out: StackPick = {
        category: p.category,
        top_pick:
          p.top_pick && validSlugs.has(p.top_pick.vendor_slug)
            ? p.top_pick
            : { vendor_slug: "", reasoning: "" },
      };
      if (p.alternative && validSlugs.has(p.alternative.vendor_slug)) {
        out.alternative = p.alternative;
      }
      return out;
    })
    .filter((p) => p.top_pick.vendor_slug);

  return parsed;
}
