import type { Metadata } from "next";
import Link from "next/link";
import { FindLeadsForm } from "./FindLeadsForm";

export const metadata: Metadata = {
  title: "Find Leads — 25 real prospects for free | Leapify",
  description:
    "Describe your ideal customer. Get 25 real prospects with LinkedIn URLs, titles, and companies in 30 seconds. Free tool by Leapify.",
  openGraph: {
    title: "Find Leads — 25 real prospects for free",
    description:
      "Describe your ICP, get 25 real LinkedIn-verified leads in 30 seconds. Free tool by Leapify.",
  },
};

export default function FindLeadsHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="px-6 pt-16 pb-16 md:pt-24">
        <div className="max-w-3xl mx-auto text-center">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 inline-block mb-6"
          >
            ← Leapify
          </Link>
          <div className="inline-block bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded-full mb-5">
            🎁 Free tool · No signup
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-gray-900 tracking-tight leading-[1.05] mb-5">
            Describe your ideal customer.
            <br />
            <span className="italic text-accent">Get 25 real leads.</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Real LinkedIn-verified prospects with titles, companies, and
            locations. Powered by 810M people in the People Data Labs graph.
          </p>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 md:p-5 max-w-2xl mx-auto">
            <FindLeadsForm />
          </div>

          <p className="text-xs text-gray-400 mt-4">
            3 free searches per day · No signup · Full results, no paywall
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-200 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl text-center mb-10 text-gray-900">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              n="1"
              title="Describe your ICP"
              body="Natural language. Titles, company stage, size, geography — however you'd describe it to a friend."
            />
            <Step
              n="2"
              title="Get 25 real leads instantly"
              body="We run your ICP against the 810M-person People Data Labs graph. Real names, titles, companies, LinkedIn URLs."
            />
            <Step
              n="3"
              title="Full list + CSV download"
              body="All 25 prospects with LinkedIn URLs. Nothing blurred, no share wall, no signup."
            />
          </div>
        </div>
      </section>

      {/* Example queries */}
      <section className="bg-gray-50 border-t border-gray-200 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold text-center mb-8">
            What people search for
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <ExampleCard text="Fractional CFOs in US at SaaS companies Series A-C" />
            <ExampleCard text="VPs of Marketing at D2C ecommerce brands doing $5M+" />
            <ExampleCard text="Heads of Operations at 3PLs with 50-200 employees" />
            <ExampleCard text="CTOs at Series B/C fintech companies" />
            <ExampleCard text="General Counsels at VC-backed startups" />
            <ExampleCard text="Founders of YC-backed AI companies" />
          </div>
        </div>
      </section>

      {/* Hunter upsell */}
      <section className="bg-gray-900 text-white px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Ready to go pro?
          </h2>
          <p className="text-gray-400 mb-2 leading-relaxed">
            This free tool is for casual research. If you hunt leads
            professionally, Hunter gives you:
          </p>
          <ul className="text-gray-300 text-sm mb-8 space-y-1">
            <li>✓ Unlimited ICP searches</li>
            <li>✓ Pre-written pitch templates for every vendor</li>
            <li>✓ 1 qualified SQL + meeting booked per month, guaranteed</li>
            <li>✓ 30% commission on every closed deal ($135–$1,125/intro)</li>
          </ul>
          <Link
            href="/hunter"
            className="inline-block bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Join Hunter — $49/mo →
          </Link>
          <p className="text-xs text-gray-500 mt-4">
            Or just keep using the free tool. No pressure.
          </p>
        </div>
      </section>
    </div>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="font-serif text-4xl text-accent mb-3">{n}</div>
      <h3 className="font-semibold text-lg mb-2 text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

function ExampleCard({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 text-gray-700">
      &ldquo;{text}&rdquo;
    </div>
  );
}
