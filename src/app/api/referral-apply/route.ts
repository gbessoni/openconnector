import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, linkedin, industry, network, referral } = body;

    if (!name || !email || !linkedin || !network) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to DB so admin can review and approve
    let applicationId: number | null = null;
    try {
      const rows = await query<{ id: number }>(
        `INSERT INTO connector_applications (name, email, linkedin, industry, network, referral, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING id`,
        [
          name,
          email.trim().toLowerCase(),
          linkedin,
          industry || null,
          network,
          referral || null,
        ]
      );
      applicationId = rows[0]?.id ?? null;
    } catch (dbErr) {
      console.error("Failed to save connector application to DB:", dbErr);
      // Don't fail the submission — still send email
    }

    const resendKey = process.env.RESEND_API_KEY;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (resendKey && notificationEmail) {
      const resend = new Resend(resendKey);
      const reviewUrl = applicationId
        ? `https://www.leapify.xyz/app/admin/applications`
        : null;
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
          ${reviewUrl ? `<p><a href="${reviewUrl}">Review application &rarr;</a></p>` : ""}
          <hr>
          <p><small>Submitted: ${new Date().toISOString()}</small></p>
        `,
      });
    }

    return NextResponse.json({ success: true, id: applicationId });
  } catch (error) {
    console.error("Referral application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
