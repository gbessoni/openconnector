"use client";

import { useState, useTransition } from "react";
import { updateCommissionRateAction } from "../actions";

export function CommissionRateInput({
  userId,
  currentRate,
}: {
  userId: number;
  currentRate: number;
}) {
  // currentRate is 0-1, display as 0-100
  const [value, setValue] = useState(String((currentRate * 100).toFixed(1)));
  const [savedMsg, setSavedMsg] = useState<"saved" | "error" | null>(null);
  const [pending, startTransition] = useTransition();

  function handleBlur() {
    const num = parseFloat(value);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      setValue(String((currentRate * 100).toFixed(1)));
      return;
    }
    if (Math.abs(num / 100 - currentRate) < 0.0001) return; // no change

    startTransition(async () => {
      const fd = new FormData();
      fd.set("user_id", String(userId));
      fd.set("rate", String(num));
      const res = await updateCommissionRateAction(fd);
      if (res?.error) {
        setSavedMsg("error");
      } else {
        setSavedMsg("saved");
        setTimeout(() => setSavedMsg(null), 1500);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        max="100"
        step="0.1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        disabled={pending}
        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <span className="text-gray-500 text-xs">%</span>
      {pending && <span className="text-xs text-gray-400">saving...</span>}
      {savedMsg === "saved" && (
        <span className="text-xs text-green-600">✓ saved</span>
      )}
      {savedMsg === "error" && (
        <span className="text-xs text-red-600">failed</span>
      )}
    </div>
  );
}
