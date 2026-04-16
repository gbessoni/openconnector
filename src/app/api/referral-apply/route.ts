import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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

    const resendKey = process.env.RESEND_API_KEY;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (!resendKey || !notificationEmail) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "OpenConnector <onboarding@resend.dev>",
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
        <p><small>Submitted: ${new Date().toISOString()}</small></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
