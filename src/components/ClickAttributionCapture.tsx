"use client";

import { useEffect } from "react";
import { captureClickIds } from "@/lib/click-attribution";

export function ClickAttributionCapture() {
  useEffect(() => {
    captureClickIds();
  }, []);
  return null;
}
