import Anthropic from "@anthropic-ai/sdk";
import type { Vendor } from "./leads";
import type { PDLSearchFilters } from "./pdl";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

const MODEL = "claude-haiku-4-5";

const COMPANY_SIZE_BUCKETS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10001+",
] as const;

const NL_PARSE_SYSTEM = `You convert natural-language ICP descriptions into People Data Labs (PDL) search filters.

Output strict JSON with this shape:
{
  "titles": ["fractional cfo", "head of finance"],           // job titles (lowercase, max 6)
  "countries": ["united states"],                             // lowercase country names (max 3)
  "company_sizes": ["51-200", "201-500"],                     // exact buckets only
  "industries": ["software", "saas"],                         // broad industry keywords (max 4)
  "display_label": "Fractional CFOs at SaaS companies 50-500 employees in US"
}

Rules:
- All title/country/industry values MUST be lowercase.
- company_sizes MUST be from: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10001+".
- Include at least one title. If user is vague, infer 2-3 likely titles.
- Infer size buckets from stage keywords: "startup"/"seed" → 1-10, 11-50; "series a" → 11-50, 51-200; "series b/c" → 51-200, 201-500; "mid-market" → 201-500, 501-1000.
- Default country to "united states" if unspecified.
- display_label is a human-readable summary, Title Case.
- Do NOT wrap in markdown fences. Return only JSON.`;

export interface LeadContext {
  company: string;
  industry?: string | null;
  revenue?: string | null;
  employees?: string | null;
  searched_vendor?: string | null;
  problem?: string | null;
}

export interface MatchReasonInput {
  vendor: Pick<Vendor, "slug" | "name" | "description" | "icp" | "target_industries">;
  lead: LeadContext;
}

const MATCH_REASON_SYSTEM = `You write ONE concise sentence (max 30 words) explaining why a specific vendor matches a buyer's situation. No buzzwords. No "leverage" or "empower". Reference the buyer's actual specifics (what they searched for, their revenue, their industry, their problem). Output plain text — no JSON, no quotes.`;

export async function generateMatchReasons(
  inputs: MatchReasonInput[]
): Promise<string[]> {
  if (inputs.length === 0) return [];

  const client = getClient();

  // One call, all reasons at once. Cheaper and faster than N calls.
  const joined = inputs
    .map(
      (inp, i) => `### Match ${i + 1}
Vendor: ${inp.vendor.name}
Vendor description: ${inp.vendor.description ?? "—"}
Vendor ICP: ${inp.vendor.icp ?? "—"}
Vendor target industries: ${inp.vendor.target_industries ?? "—"}

Buyer company: ${inp.lead.company}
Buyer industry: ${inp.lead.industry ?? "—"}
Buyer revenue: ${inp.lead.revenue ?? "—"}
Buyer employees: ${inp.lead.employees ?? "—"}
Buyer searched for: ${inp.lead.searched_vendor ?? "—"}
Buyer's problem: ${inp.lead.problem ?? "—"}
`
    )
    .join("\n\n");

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: MATCH_REASON_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Write ONE match reason per match below. Return them numbered 1, 2, 3... exactly in order, one per line. No extra commentary.\n\n${joined}`,
      },
    ],
  });

  const textBlock = res.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return inputs.map(() => "");
  }

  // Parse numbered lines
  const lines = textBlock.text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const reasons: string[] = inputs.map(() => "");
  for (const line of lines) {
    const m = line.match(/^(\d+)[\.\)]\s*(.+)$/);
    if (m) {
      const idx = parseInt(m[1], 10) - 1;
      if (idx >= 0 && idx < inputs.length) {
        reasons[idx] = m[2].trim();
      }
    }
  }
  return reasons;
}

export async function parseICPQuery(
  nl: string
): Promise<{ filters: PDLSearchFilters; display_label: string }> {
  const client = getClient();

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: NL_PARSE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `ICP description: "${nl}"\n\nReturn only JSON.`,
      },
    ],
  });

  const textBlock = res.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in Claude response");
  }
  let raw = textBlock.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }

  let parsed: {
    titles?: string[];
    countries?: string[];
    company_sizes?: string[];
    industries?: string[];
    display_label?: string;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Claude returned invalid JSON for ICP parse");
  }

  // Sanitize
  const titles = (parsed.titles ?? []).slice(0, 6).filter((s) => typeof s === "string");
  const countries = (parsed.countries ?? []).slice(0, 3).filter((s) => typeof s === "string");
  const company_sizes = (parsed.company_sizes ?? []).filter((s) =>
    (COMPANY_SIZE_BUCKETS as readonly string[]).includes(s)
  );
  const industries = (parsed.industries ?? []).slice(0, 4).filter((s) => typeof s === "string");

  return {
    filters: {
      titles: titles.length ? titles : undefined,
      countries: countries.length ? countries : undefined,
      company_sizes: company_sizes.length ? company_sizes : undefined,
      industries: industries.length ? industries : undefined,
      size: 25,
    },
    display_label: parsed.display_label || nl,
  };
}

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
