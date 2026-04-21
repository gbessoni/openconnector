import { NextRequest, NextResponse } from "next/server";
import { processDripSequence } from "@/lib/hunter-emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Vercel Cron hits this with Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDripSequence();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Cron hunter-emails failed", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
