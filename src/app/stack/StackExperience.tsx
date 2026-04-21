"use client";

import { useEffect, useState } from "react";
import { GeistSans } from "geist/font/sans";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { HowItWorks } from "./HowItWorks";
import { QualificationForm } from "./QualificationForm";
import { Matches } from "./Matches";
import { Confirmation } from "./Confirmation";
import type { MatchedVendor } from "./actions";

type View = "landing" | "matches" | "confirmation";

export function StackExperience({
  searchParamsPromise,
}: {
  searchParamsPromise?: Promise<{ vendor?: string }>;
}) {
  const [view, setView] = useState<View>("landing");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [leadEmail, setLeadEmail] = useState<string>("");
  const [matches, setMatches] = useState<MatchedVendor[]>([]);
  const [prefilledVendor, setPrefilledVendor] = useState<string>("");

  // Pre-fill vendor from ?vendor= query param (ad landing)
  useEffect(() => {
    if (!searchParamsPromise) return;
    searchParamsPromise.then((p) => {
      if (p?.vendor) setPrefilledVendor(p.vendor);
    });
  }, [searchParamsPromise]);

  function onSubmitSuccess(leadId: number, email: string, matches: MatchedVendor[]) {
    setLeadId(leadId);
    setLeadEmail(email);
    setMatches(matches);
    setView("matches");
    // Scroll to top on view change
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function onMeetingsConfirmed() {
    setView("confirmation");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function scrollToForm() {
    const el = document.getElementById("qualification-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={`${GeistSans.className} min-h-screen bg-[#0a0a0a] text-white antialiased`}>
      {view === "landing" && (
        <>
          <Hero onCTA={scrollToForm} />
          <SocialProof />
          <HowItWorks />
          <section id="qualification-form" className="px-6 py-20 md:py-28">
            <div className="max-w-2xl mx-auto">
              <QualificationForm
                prefilledVendor={prefilledVendor}
                onSuccess={onSubmitSuccess}
              />
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

      {view === "confirmation" && (
        <Confirmation email={leadEmail} />
      )}
    </div>
  );
}
