"use client";

import { useState, useTransition } from "react";
import {
  approveApplicationAction,
  declineApplicationAction,
} from "../../actions";

interface Application {
  id: number;
  name: string;
  email: string;
  linkedin: string;
  industry: string | null;
  network: string;
  referral: string | null;
  status: "pending" | "approved" | "declined";
  review_note: string | null;
  reviewer_id: number | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_user_id: number | null;
  created_at: string;
}

export function ApplicationCard({ app }: { app: Application }) {
  const [showDecline, setShowDecline] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function approve() {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("application_id", String(app.id));
      const res = await approveApplicationAction(fd);
      if (res?.error) setMsg({ type: "err", text: res.error });
      else
        setMsg({
          type: "ok",
          text: "Approved. Email with temp password sent.",
        });
    });
  }

  function decline() {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("application_id", String(app.id));
      if (declineNote.trim()) fd.set("note", declineNote);
      const res = await declineApplicationAction(fd);
      if (res?.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "Declined." });
        setShowDecline(false);
      }
    });
  }

  const statusColor =
    app.status === "pending"
      ? "bg-amber-100 text-amber-800"
      : app.status === "approved"
      ? "bg-green-100 text-green-800"
      : "bg-gray-200 text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{app.name}</h3>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}
            >
              {app.status}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <a
              href={`mailto:${app.email}`}
              className="text-indigo-600 hover:underline"
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
            {app.industry && <span className="text-gray-500"> · {app.industry}</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Submitted {new Date(app.created_at).toLocaleString()}
          </div>
        </div>
        {app.status === "pending" && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={approve}
              disabled={pending}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "..." : "✓ Approve"}
            </button>
            <button
              onClick={() => setShowDecline((v) => !v)}
              disabled={pending}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Decline
            </button>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-3">
        <div className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">
          Their network
        </div>
        <p className="whitespace-pre-wrap">{app.network}</p>
      </div>

      {app.referral && (
        <div className="text-xs text-gray-500 mt-2">
          <strong>Heard about us:</strong> {app.referral}
        </div>
      )}

      {showDecline && app.status === "pending" && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Decline reason (internal only)
          </label>
          <textarea
            value={declineNote}
            onChange={(e) => setDeclineNote(e.target.value)}
            rows={2}
            placeholder="Optional note for your records..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={decline}
              disabled={pending}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {pending ? "..." : "Confirm decline"}
            </button>
            <button
              onClick={() => setShowDecline(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {app.status !== "pending" && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {app.status === "approved" ? "✓ Approved" : "✗ Declined"}
          {app.reviewer_name && ` by ${app.reviewer_name}`}
          {app.reviewed_at &&
            ` on ${new Date(app.reviewed_at).toLocaleDateString()}`}
          {app.review_note && (
            <div className="mt-1 italic text-gray-600">
              &ldquo;{app.review_note}&rdquo;
            </div>
          )}
        </div>
      )}

      {msg && (
        <div
          className={`mt-3 text-xs px-3 py-1.5 rounded ${
            msg.type === "ok"
              ? "text-green-700 bg-green-50 border border-green-200"
              : "text-red-700 bg-red-50 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
