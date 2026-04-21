import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { query } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, linkedin, industry, network, referral } = body;

    if (!name || !email || !linkedin || !network) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    await query(
      `INSERT INTO connector_applications
         (name, email, linkedin, industry, network, referral)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, email, linkedin, industry || null, network, referral || null]
    );

    const resendKey = process.env.RESEND_API_KEY;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (resendKey && notificationEmail) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Leapify <onboarding@resend.dev>",
        to: notificationEmail,
        subject: `New referral partner application from ${name}`,
        html: `
          <h2>New Referral Partner Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></p>
          ${industry ? `<p><strong>Industry Focus:</strong> ${industry}</p>` : ""}
          <p><strong>Network:</strong> ${network}</p>
          ${referral ? `<p><strong>Heard about us:</strong> ${referral}</p>` : ""}
          <hr>
          <p>Review & approve in the admin queue: <a href="${process.env.APP_URL || ""}/app/admin/applications">Applications</a></p>
          <p><small>Submitted: ${new Date().toISOString()}</small></p>
        `,
      });
    }

    return NextResponse.json(
      { success: true },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Referral application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
