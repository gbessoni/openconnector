import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "You're in — welcome to Hunter | Leapify",
  robots: { index: false, follow: false },
};

export default function HunterThanksPage() {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6 py-16"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px circle at 50% 30%, rgba(0,255,136,0.18), transparent 60%)",
        }}
      />
      <div className="relative max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/40 mb-8">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12L10 17L19 7"
              stroke="#00ff88"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-4">
          You&apos;re in.
        </h1>
        <p className="text-white/70 text-lg leading-relaxed mb-10">
          Check your email for login credentials and your first onboarding
          note. You can start submitting intros right away — no card required.
        </p>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-10 text-left">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden bg-white/5 border border-white/10">
              <Image
                src="/images/greg-bessoni.jpg"
                alt="Greg Bessoni"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-semibold">Greg Bessoni</div>
              <div className="text-sm text-white/60">
                Leapify · gbessoni07@gmail.com
              </div>
            </div>
          </div>
          <p className="text-sm text-white/80 italic mt-4 leading-relaxed">
            &ldquo;Welcome. First check usually lands within 2-3 weeks. Reply
            to any onboarding email if you get stuck — I read every one.&rdquo;
          </p>
        </div>

        <Link
          href="/app/login"
          className="inline-block bg-[#00ff88] hover:bg-[#00e67a] text-black px-7 py-3.5 rounded-full font-semibold transition-colors"
        >
          Log into the platform →
        </Link>

        <p className="mt-6 text-xs text-white/40">
          Questions?{" "}
          <a
            href="mailto:greg@parkingaccess.com"
            className="underline underline-offset-2"
          >
            greg@parkingaccess.com
          </a>
        </p>
      </div>
    </div>
  );
}
