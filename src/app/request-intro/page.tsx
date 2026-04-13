"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getAllCompanies } from "@/lib/companies";

const companies = getAllCompanies();
const companyNames = companies.map((c) => c.name).sort();

function IntroForm() {
  const searchParams = useSearchParams();
  const preselectedCompany = searchParams.get("company") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    role: "",
    stage: "",
    problem: "",
    whyFit: "",
    interestedIn: preselectedCompany
      ? [companies.find((c) => c.slug === preselectedCompany)?.name || ""]
          .filter(Boolean)
      : [] as string[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function toggleCompany(name: string) {
    setFormData((prev) => {
      const current = prev.interestedIn;
      if (current.includes(name)) {
        return { ...prev, interestedIn: current.filter((n) => n !== name) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, interestedIn: [...current, name] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/request-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="font-serif text-4xl mb-4">Thank you.</div>
          <p className="text-gray-600 text-lg">
            I review every request personally. If there&apos;s a strong fit,
            I&apos;ll connect you directly with their team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-bg-dark text-text-light py-20">
        <div className="mx-auto max-w-[800px] px-6 text-center">
          <h1 className="font-serif text-4xl md:text-5xl leading-tight mb-4">
            Get Connected
          </h1>
          <p className="text-lg opacity-80">
            I review every request personally. Only strong fits get connected.
          </p>
        </div>
      </section>

      {/* Interested Companies */}
      <section className="bg-bg-accent py-12">
        <div className="mx-auto max-w-[800px] px-6">
          <h2 className="font-serif text-2xl mb-2">
            Select up to 3 that are relevant
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {formData.interestedIn.length}/3 selected
          </p>
          <div className="flex flex-wrap gap-2">
            {companyNames.map((name) => {
              const selected = formData.interestedIn.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCompany(name)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selected
                      ? "bg-accent text-white"
                      : "bg-white text-text-primary hover:bg-gray-100"
                  } ${
                    !selected && formData.interestedIn.length >= 3
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={!selected && formData.interestedIn.length >= 3}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-bg-light py-16">
        <div className="mx-auto max-w-[800px] px-6">
          <h2 className="font-serif text-2xl mb-8">Your Details</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-500 mb-4">
              Only submit if: you&apos;re a decision-maker (or close to one),
              your company fits the target profile, and you have an active need.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) =>
                    setFormData({ ...formData, stage: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent bg-white"
                >
                  <option value="">Select...</option>
                  <option value="Pre-seed / Seed">Pre-seed / Seed</option>
                  <option value="Series A-B">Series A-B</option>
                  <option value="Growth / Series C+">Growth / Series C+</option>
                  <option value="Enterprise / Public">
                    Enterprise / Public
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                What problem are you trying to solve right now? *
              </label>
              <textarea
                required
                rows={3}
                value={formData.problem}
                onChange={(e) =>
                  setFormData({ ...formData, problem: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Why is this a strong fit right now?
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Be specific: problem, timing, and why this solution makes sense.
              </p>
              <textarea
                rows={3}
                value={formData.whyFit}
                onChange={(e) =>
                  setFormData({ ...formData, whyFit: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || formData.interestedIn.length === 0}
              className="bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-full font-medium transition-colors w-full md:w-auto"
            >
              {submitting ? "Submitting..." : "Get Connected"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

export default function RequestIntroPage() {
  return (
    <Suspense>
      <IntroForm />
    </Suspense>
  );
}
