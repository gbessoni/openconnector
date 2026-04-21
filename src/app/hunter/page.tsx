import type { Metadata } from "next";
import { HunterLanding } from "./HunterLanding";

export const metadata: Metadata = {
  title: "Hunter — turn 30 minutes a day into $500–$1,500/week | Leapify",
  description:
    "$49/mo. Guaranteed first lead. 30% commission on every closed deal. Our B2B lead platform + pitch templates + weekly hot list. For hustlers, laid-off SDRs, and side-hustle seekers.",
  openGraph: {
    title: "Turn 30 minutes a day into $500–$1,500/week",
    description:
      "$49/mo subscription → B2B lead platform + 1 guaranteed SQL/mo + 30% commission. Real payouts. No boss, no quota.",
  },
};

export default function HunterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <HunterLanding searchParamsPromise={searchParams} />;
}
