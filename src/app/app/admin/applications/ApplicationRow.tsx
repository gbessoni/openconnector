"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveConnectorApplicationAction,
  declineConnectorApplicationAction,
} from "../../actions";

interface App {
  id: number;
  name: string;
  email: string;
  linkedin: string;
  industry: string | null;
  network: string;
  referral: string | null;
  created_at: string;
}

export function ApplicationRow({ app }: { app: App }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(kind: "approve" | "decline") {
    if (
      kind === "decline" &&
      !confirm(`Decline ${app.name}'s application? They'll be emailed.`)
    ) {
      return;
    }
    setLoading(kind);
    setError(null);
    const fd = new FormData();
    fd.set("id", String(app.id));
    fd.set("note", note);
    const action =
      kind === "approve"
        ? approveConnectorApplicationAction
        : declineConnectorApplicationAction;
    const res = await action(fd);
    setLoading(null);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{app.name}</h3>
          <p className="text-sm text-gray-600">
            <a
              href={`mailto:${app.email}`}
              className="hover:underline"
            >
              {app.email}
            </a>
            {" · "}
            <a
              href={app.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              LinkedIn
            </a>
          </p>
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {new Date(app.created_at).toLocaleDateString()}
        </span>
      </div>

      <dl className="text-sm text-gray-700 space-y-1.5 mb-4">
        {app.industry && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-gray-500">Industry</dt>
            <dd>{app.industry}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-gray-500">Network</dt>
          <dd className="whitespace-pre-wrap">{app.network}</dd>
        </div>
        {app.referral && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-gray-500">Heard via</dt>
            <dd>{app.referral}</dd>
          </div>
        )}
      </dl>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note — included in the approval/decline email"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y mb-3"
      />

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => handle("decline")}
          disabled={loading !== null}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading === "decline" ? "Declining..." : "Decline"}
        </button>
        <button
          type="button"
          onClick={() => handle("approve")}
          disabled={loading !== null}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading === "approve" ? "Approving..." : "Approve & invite"}
        </button>
      </div>
    </div>
  );
}
