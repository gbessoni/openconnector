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

type View = "landing" | "matches" | "confirmation";

export function StackExperience({
  searchParamsPromise,
}: {
  searchParamsPromise?: Promise<{ vendor?: string; mode?: string }>;
}) {
  const [view, setView] = useState<View>("landing");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [leadEmail, setLeadEmail] = useState<string>("");
  const [matches, setMatches] = useState<MatchedVendor[]>([]);
  const [prefilledVendor, setPrefilledVendor] = useState<string>("");
  const [paramsLoaded, setParamsLoaded] = useState(false);

  // Pre-fill vendor from ?vendor= query param (ad landing)
  useEffect(() => {
    if (!searchParamsPromise) {
      setParamsLoaded(true);
      return;
    }
    searchParamsPromise.then((p) => {
      if (p?.vendor) setPrefilledVendor(p.vendor);
      setParamsLoaded(true);
    });
  }, [searchParamsPromise]);

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

  // Only render the form once search params have resolved — keeps the form in
  // sync (so we know whether to skip the vendor question)
  const hasVendorParam = !!prefilledVendor;

  return (
    <div
      className={`${GeistSans.className} min-h-screen bg-[#0a0a0a] text-white antialiased`}
    >
      {view === "landing" && (
        <>
          <Hero onCTA={scrollToForm} />
          <SocialProof />
          <HowItWorks />
          <section id="qualification-form" className="px-6 py-20 md:py-28">
            <div className="max-w-2xl mx-auto">
              {!paramsLoaded ? (
                <div className="text-center text-white/40 text-sm">Loading…</div>
              ) : hasVendorParam ? (
                // Ad-traffic flow: they know what vendor they searched for,
                // show structured form (vendor field auto-hidden inside form)
                <QualificationForm
                  prefilledVendor={prefilledVendor}
                  onSuccess={onSubmitSuccess}
                />
              ) : (
                // Organic flow: NL is primary, structured form as fallback
                <NLFinder onSuccess={onSubmitSuccess} />
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
