import type { Metadata } from "next";
import { HunterLanding } from "./HunterLanding";

export const metadata: Metadata = {
  title: "Hunter — turn 30 minutes a day into $500–$1,500/week | Leapify",
  description:
    "Free to join. 30% commission on every closed deal. Real payouts. For hustlers, former SDRs, recruiters, and side-hustle seekers who want to earn from warm intros.",
  openGraph: {
    title: "Turn 30 minutes a day into $500–$1,500/week",
    description:
      "Free to join. 30% of every closed deal, paid in 30 days. No cold calls. No quota. No boss.",
  },
};

export default function HunterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <HunterLanding searchParamsPromise={searchParams} />;
}
