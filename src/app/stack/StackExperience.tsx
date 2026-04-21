"use client";

import { useEffect, useState } from "react";
import { GeistSans } from "geist/font/sans";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { HowItWorks } from "./HowItWorks";
import { QualificationForm } from "./QualificationForm";
import { NLFinder } from "./NLFinder";
import { Matches } from "./Matches";
import { Confirmation } from "./Confirmation";
import type { MatchedVendor } from "./actions";
import type { VendorAngle } from "@/data/vendor-ad-angles";

type View = "landing" | "matches" | "confirmation";

export interface UTMBundle {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  source?: string;
  campaign?: string;
  gclid?: string;
  fbclid?: string;
  landing_path?: string;
}

export function StackExperience({
  vendor,
  vendorSlug,
  utm,
}: {
  vendor: VendorAngle | null;
  vendorSlug: string | null;
  utm: UTMBundle;
}) {
  const [view, setView] = useState<View>("landing");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [leadEmail, setLeadEmail] = useState<string>("");
  const [matches, setMatches] = useState<MatchedVendor[]>([]);

  // Reset scroll when view changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [view]);

  function onSubmitSuccess(
    leadId: number,
    email: string,
    matches: MatchedVendor[]
  ) {
    setLeadId(leadId);
    setLeadEmail(email);
    setMatches(matches);
    setView("matches");
  }

  function onMeetingsConfirmed() {
    setView("confirmation");
  }

  function scrollToForm() {
    const el = document.getElementById("qualification-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // When we have a known vendor, use the structured form pre-filled with vendor
  // context. Otherwise use the NL method as primary entry.
  const hasVendor = !!vendor;
  // Use the display name as the prefilled vendor so the lead record captures
  // the canonical name, not the raw slug
  const prefilledVendor = vendor?.displayName ?? vendorSlug ?? "";

  return (
    <div
      className={`${GeistSans.className} min-h-screen bg-[#0a0a0a] text-white antialiased`}
    >
      {view === "landing" && (
        <>
          <Hero onCTA={scrollToForm} vendor={vendor} />
          <SocialProof />
          <HowItWorks />
          <section id="qualification-form" className="px-6 py-20 md:py-28">
            <div className="max-w-2xl mx-auto">
              {hasVendor ? (
                <QualificationForm
                  prefilledVendor={prefilledVendor}
                  utm={utm}
                  onSuccess={onSubmitSuccess}
                />
              ) : (
                <NLFinder utm={utm} onSuccess={onSubmitSuccess} />
              )}
            </div>
          </section>
        </>
      )}

      {view === "matches" && leadId !== null && (
        <Matches
          leadId={leadId}
          matches={matches}
          onConfirmed={onMeetingsConfirmed}
        />
      )}

      {view === "confirmation" && <Confirmation email={leadEmail} />}
    </div>
  );
}
