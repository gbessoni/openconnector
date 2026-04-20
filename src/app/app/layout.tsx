import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leapify Portal",
  description: "Leapify connector portal",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
