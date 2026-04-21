import Image from "next/image";
import Link from "next/link";

export function Confirmation({ email }: { email: string }) {
  return (
    <div className="relative min-h-screen px-6 py-14 md:py-24 flex items-center">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px circle at 50% 20%, rgba(91,79,232,0.20), transparent 60%)",
        }}
      />

      <div className="relative max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5B4FE8]/20 border border-[#5B4FE8]/40 mb-8">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12L10 17L19 7"
              stroke="#5B4FE8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-semibold tracking-[-0.025em] mb-5">
          You&apos;re all set.
        </h1>
        <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-md mx-auto">
          We&apos;ll send you a calendar link within the next 24 hours to book
          your selected meetings. Watch your inbox at{" "}
          <span className="text-white font-medium">{email}</span>.
        </p>

        {/* Greg signature card */}
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
              <div className="font-semibold text-white">Greg Bessoni</div>
              <div className="text-sm text-white/60">Leapify</div>
              <a
                href="mailto:gbessoni07@gmail.com"
                className="text-xs text-[#5B4FE8] hover:text-[#7a6fff] transition-colors"
              >
                gbessoni07@gmail.com
              </a>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white/90 transition-colors inline-flex items-center gap-2"
        >
          While you wait, see how Leapify works
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
