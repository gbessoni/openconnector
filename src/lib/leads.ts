export const LEAD_STATUSES = [
  { value: "submitted", label: "Submitted", color: "bg-gray-100 text-gray-700" },
  { value: "pending_optin", label: "Pending opt-in", color: "bg-amber-100 text-amber-800" },
  { value: "vendor_interested", label: "Vendor interested", color: "bg-blue-100 text-blue-800" },
  { value: "intro_sent", label: "Intro sent", color: "bg-indigo-100 text-indigo-800" },
  { value: "meeting_booked", label: "Meeting booked", color: "bg-purple-100 text-purple-800" },
  { value: "qualified", label: "Qualified", color: "bg-teal-100 text-teal-800" },
  { value: "closed_won", label: "Closed won", color: "bg-green-100 text-green-800" },
  { value: "paid", label: "Paid", color: "bg-emerald-200 text-emerald-900" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-200 text-gray-600" },
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"];

export function getStatusMeta(value: string) {
  return (
    LEAD_STATUSES.find((s) => s.value === value) ?? {
      value,
      label: value,
      color: "bg-gray-100 text-gray-700",
    }
  );
}

export interface Lead {
  id: number;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  lead_name: string;
  lead_email: string | null;
  lead_linkedin: string | null;
  company: string;
  company_website: string | null;
  title: string | null;
  vendor: string | null;
  category: string | null;
  why_fit: string | null;
  notes: string | null;
  status: string;
  estimated_payout: number | null;
  actual_payout: number | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadEvent {
  id: number;
  lead_id: number;
  actor_id: number | null;
  actor_name?: string | null;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
}
