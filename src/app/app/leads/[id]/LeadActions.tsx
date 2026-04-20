"use client";

import { useState, useTransition } from "react";
import { updateLeadStatusAction, addNoteAction } from "../../actions";

interface Status {
  value: string;
  label: string;
  color: string;
}

export function LeadActions({
  leadId,
  currentStatus,
  statuses,
}: {
  leadId: number;
  currentStatus: string;
  statuses: Status[];
}) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function handleUpdateStatus() {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lead_id", String(leadId));
      fd.set("status", newStatus);
      if (note.trim()) fd.set("note", note);
      const res = await updateLeadStatusAction(fd);
      if (res?.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "Status updated" });
        setNote("");
      }
    });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("lead_id", String(leadId));
      fd.set("note", note);
      const res = await addNoteAction(fd);
      if (res?.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "Note added" });
        setNote("");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Status
        </label>
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What happened? Context for the update..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
        />
      </div>

      {msg && (
        <div
          className={`text-xs px-3 py-1.5 rounded ${
            msg.type === "ok"
              ? "text-green-700 bg-green-50 border border-green-200"
              : "text-red-700 bg-red-50 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleUpdateStatus}
          disabled={pending || newStatus === currentStatus}
          className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          {pending ? "Saving..." : "Update status"}
        </button>
        <button
          onClick={handleAddNote}
          disabled={pending || !note.trim()}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          Note only
        </button>
      </div>
    </div>
  );
}
