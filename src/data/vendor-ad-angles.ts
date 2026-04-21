// Display names + positioning angles for the /stack ad landing page.
// Keys are lowercase + trimmed — the normalize() helper handles user input.
// Add a new vendor by adding a new line here.

export interface VendorAngle {
  displayName: string;
  angle: string; // Positioning line used in the hero subhead
}

export const VENDOR_MAP: Record<string, VendorAngle> = {
  rippling: {
    displayName: "Rippling",
    angle: "HR & payroll alternatives our network trusts",
  },
  deel: {
    displayName: "Deel",
    angle: "global payroll alternatives built for fast teams",
  },
  gusto: {
    displayName: "Gusto",
    angle: "payroll alternatives our founders actually use",
  },
  adp: {
    displayName: "ADP",
    angle: "modern payroll alternatives without the enterprise drag",
  },
  paychex: {
    displayName: "Paychex",
    angle: "payroll alternatives built for startups, not dinosaurs",
  },
  justworks: {
    displayName: "Justworks",
    angle: "PEO alternatives our growth-stage teams picked",
  },
  trinet: {
    displayName: "TriNet",
    angle: "PEO alternatives with better tech and lower fees",
  },
  brex: {
    displayName: "Brex",
    angle: "corporate card alternatives that don't claw back",
  },
  mercury: {
    displayName: "Mercury",
    angle: "business banking alternatives with better rewards",
  },
  ramp: {
    displayName: "Ramp",
    angle: "finance stack alternatives for growing teams",
  },
  rho: {
    displayName: "Rho",
    angle: "banking + spend management alternatives worth switching for",
  },
  slash: {
    displayName: "Slash",
    angle: "startup banking alternatives with real treasury yields",
  },
  chase: {
    displayName: "Chase",
    angle: "business banking alternatives built for modern teams",
  },
  carta: {
    displayName: "Carta",
    angle: "cap table alternatives without the price hike",
  },
  pulley: {
    displayName: "Pulley",
    angle: "equity management alternatives our operators picked",
  },
  angellist: {
    displayName: "AngelList",
    angle: "fund admin alternatives that actually scale",
  },
  stripe: {
    displayName: "Stripe",
    angle: "payment alternatives with better cross-border rates",
  },
  gorgias: {
    displayName: "Gorgias",
    angle: "ecommerce support alternatives that reduce tickets",
  },
  zendesk: {
    displayName: "Zendesk",
    angle: "support alternatives built for modern teams",
  },
  intercom: {
    displayName: "Intercom",
    angle: "customer messaging alternatives our ops teams switched to",
  },
  klaviyo: {
    displayName: "Klaviyo",
    angle: "ecommerce marketing alternatives that drive real lift",
  },
  attentive: {
    displayName: "Attentive",
    angle: "SMS marketing alternatives with better deliverability",
  },
  postscript: {
    displayName: "Postscript",
    angle: "SMS alternatives our 8-figure brands use",
  },
  mailchimp: {
    displayName: "Mailchimp",
    angle: "email marketing alternatives built for growth",
  },
  shipbob: {
    displayName: "ShipBob",
    angle: "3PL alternatives with better margins and speed",
  },
  shipstation: {
    displayName: "ShipStation",
    angle: "shipping alternatives our ops teams recommend",
  },
  flexport: {
    displayName: "Flexport",
    angle: "freight alternatives that don't require a 6-month onboarding",
  },
  stord: {
    displayName: "Stord",
    angle: "3PL alternatives our $10M+ brands actually use",
  },
  quickbooks: {
    displayName: "QuickBooks",
    angle: "accounting alternatives built for founders, not bookkeepers",
  },
  xero: {
    displayName: "Xero",
    angle: "accounting alternatives with better integrations",
  },
  bench: {
    displayName: "Bench",
    angle: "bookkeeping alternatives our founders don't dread",
  },
  pilot: {
    displayName: "Pilot",
    angle: "bookkeeping alternatives with real CFO-level support",
  },
  taxjar: {
    displayName: "TaxJar",
    angle: "sales tax alternatives that just work",
  },
  avalara: {
    displayName: "Avalara",
    angle: "sales tax alternatives without the enterprise price tag",
  },
  numeral: {
    displayName: "Numeral",
    angle: "sales tax alternatives trusted by top ecom brands",
  },
  chargebee: {
    displayName: "Chargebee",
    angle: "subscription billing alternatives built for modern SaaS",
  },
  zoominfo: {
    displayName: "ZoomInfo",
    angle: "B2B data alternatives our GTM teams actually use",
  },
  apollo: {
    displayName: "Apollo",
    angle: "sales intelligence alternatives that hit conversion",
  },
  clay: {
    displayName: "Clay",
    angle: "outbound tooling alternatives with real enrichment",
  },
  lusha: {
    displayName: "Lusha",
    angle: "contact data alternatives with fresher info",
  },
  hubspot: {
    displayName: "HubSpot",
    angle: "CRM alternatives that don't charge per seat",
  },
  salesforce: {
    displayName: "Salesforce",
    angle: "CRM alternatives built for teams that actually sell",
  },
  outreach: {
    displayName: "Outreach",
    angle: "sales engagement alternatives your reps will use",
  },
  salesloft: {
    displayName: "Salesloft",
    angle: "sales engagement alternatives with modern tooling",
  },
  greenhouse: {
    displayName: "Greenhouse",
    angle: "hiring platform alternatives built for modern teams",
  },
  lever: {
    displayName: "Lever",
    angle: "ATS alternatives with better candidate flow",
  },
  toptal: {
    displayName: "Toptal",
    angle: "talent platform alternatives at 1/3 the cost",
  },
  upwork: {
    displayName: "Upwork",
    angle: "freelance platform alternatives with real vetting",
  },
  clerky: {
    displayName: "Clerky",
    angle: "startup legal alternatives built for C-corps",
  },
  docusign: {
    displayName: "DocuSign",
    angle: "e-signature alternatives with better workflows",
  },
  pandadoc: {
    displayName: "PandaDoc",
    angle: "proposal alternatives our sales teams picked",
  },
  expensify: {
    displayName: "Expensify",
    angle: "expense management alternatives your team won't hate",
  },
  "bill.com": {
    displayName: "Bill.com",
    angle: "AP automation alternatives that don't nickel-and-dime",
  },
  divvy: {
    displayName: "Divvy",
    angle: "spend management alternatives built for scale",
  },
  ups: {
    displayName: "UPS",
    angle: "shipping cost recovery alternatives our ops teams use",
  },
  fedex: {
    displayName: "FedEx",
    angle: "shipping rate audit alternatives our brands trust",
  },
};

export function normalizeVendorSlug(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

export function getVendorAngle(raw: string | undefined | null): VendorAngle | null {
  const normalized = normalizeVendorSlug(raw);
  if (!normalized) return null;
  return VENDOR_MAP[normalized] ?? null;
}
