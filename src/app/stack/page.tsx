import type { Metadata } from "next";
import { StackExperience } from "./StackExperience";

export const metadata: Metadata = {
  title: "Stack by Leapify — Your stack, upgraded.",
  description:
    "Tell us what you're running. We'll match you to 3 vendors our network stands behind. No sales calls until you say so.",
  openGraph: {
    title: "Stack by Leapify — Your stack, upgraded.",
    description:
      "Get matched to 3 vendors from Leapify's vetted network in 60 seconds. No cold outreach.",
  },
};

export default function StackPage({
  searchParams,
}: {
  searchParams?: Promise<{ vendor?: string }>;
}) {
  return <StackExperience searchParamsPromise={searchParams} />;
}
