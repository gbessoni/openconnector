"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/track";

export function ViewContentFire() {
  useEffect(() => {
    trackViewContent({
      contentName: "hunter_landing",
      contentCategory: "free_signup",
      value: 0,
      currency: "USD",
    });
  }, []);
  return null;
}
