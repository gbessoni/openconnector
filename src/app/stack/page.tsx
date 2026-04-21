import type { Metadata } from "next";
import { StackExperience } from "./StackExperience";
import { getVendorAngle, normalizeVendorSlug } from "@/data/vendor-ad-angles";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickString(
  p: Record<string, string | string[] | undefined> | undefined,
  k: string
): string | undefined {
  const v = p?.[k];
  return typeof v === "string" ? v : undefined;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const p = (await searchParams) || {};
  const vendor = getVendorAngle(pickString(p, "vendor"));

  // Vendor-parameterized variants: noindex to avoid duplicate content
  if (vendor) {
    return {
      title: `${vendor.displayName} alternatives — Leapify`,
      description: `Reconsidering ${vendor.displayName}? We'll match you to 3 ${vendor.angle} in 60 seconds, with a direct intro to the founder.`,
      robots: { index: false, follow: false },
      openGraph: {
        title: `${vendor.displayName} alternatives — Leapify`,
        description: `3 ${vendor.angle} — matched in 60 seconds.`,
      },
    };
  }

  return {
    title: "Stack by Leapify — Upgrade your stack.",
    description:
      "Tell us what you're running and we'll match you to 3 vendors our network stands behind. No sales calls until you say so.",
    openGraph: {
      title: "Stack by Leapify — Upgrade your stack.",
      description:
        "Get matched to 3 vendors from Leapify's vetted network in 60 seconds.",
    },
  };
}

export default async function StackPage({ searchParams }: PageProps) {
  const p = (await searchParams) || {};
  const rawVendor = pickString(p, "vendor");
  const vendorSlugNormalized = normalizeVendorSlug(rawVendor);
  const vendor = getVendorAngle(rawVendor);

  // Dev-only warning when an unknown vendor slug is passed, so we can spot
  // new competitor searches we should add to VENDOR_MAP
  if (process.env.NODE_ENV !== "production" && vendorSlugNormalized && !vendor) {
    // eslint-disable-next-line no-console
    console.warn(
      `[stack] Unknown vendor slug: "${vendorSlugNormalized}" — add to VENDOR_MAP in src/data/vendor-ad-angles.ts`
    );
  }

  // Pull UTM params + click IDs for attribution
  // Preserve the original landing path as "landing_path" for attribution
  const qsParts: string[] = [];
  if (rawVendor) qsParts.push(`vendor=${encodeURIComponent(rawVendor)}`);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  utmKeys.forEach((k) => {
    const v = pickString(p, k);
    if (v) qsParts.push(`${k}=${encodeURIComponent(v)}`);
  });

  const utm = {
    utm_source: pickString(p, "utm_source"),
    utm_medium: pickString(p, "utm_medium"),
    utm_campaign: pickString(p, "utm_campaign"),
    utm_content: pickString(p, "utm_content"),
    utm_term: pickString(p, "utm_term"),
    source: pickString(p, "source"),
    campaign: pickString(p, "campaign"),
    gclid: pickString(p, "gclid"),
    fbclid: pickString(p, "fbclid"),
    landing_path: qsParts.length ? `/stack?${qsParts.join("&")}` : "/stack",
  };

  return (
    <StackExperience
      vendor={vendor}
      vendorSlug={vendorSlugNormalized}
      utm={utm}
    />
  );
}
