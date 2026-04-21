"use client";

import { useState, useTransition } from "react";
import { deleteUserAction } from "./actions";

export function UserRowActions({
  userId,
  userName,
  userEmail,
  userRole,
  leadCount,
  currentAdminId,
}: {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  leadCount: number;
  currentAdminId: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Hide delete for self + other admins (server enforces this too)
  const canDelete = userId !== currentAdminId && userRole !== "admin";

  function handleDelete() {
    if (
      !confirm(
        `Delete ${userName} (${userEmail})? This can't be undone.${
          leadCount > 0
            ? `\n\nThey own ${leadCount} lead(s) — delete will be blocked until those are removed or reassigned.`
            : ""
        }`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", String(userId));
      const res = await deleteUserAction(fd);
      if ("error" in res) {
        setError(res.error);
      }
    });
  }

  if (!canDelete) {
    return <span className="text-gray-300 text-xs">—</span>;
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs text-red-600 hover:text-red-800 hover:underline transition-colors disabled:opacity-50"
      >
        {pending ? "..." : "🗑 Delete"}
      </button>
      {error && (
        <span className="text-[10px] text-red-700 text-right max-w-[200px]">
          {error}
        </span>
      )}
    </div>
  );
}
