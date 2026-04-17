import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, website, role, stage, problem, whyFit, interestedIn } = body;

    if (!name || !email || !company || !problem || !interestedIn?.length) {
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
      from: "Leapify <onboarding@resend.dev>",
      to: notificationEmail,
      subject: `New intro request from ${name} at ${company}`,
      html: `
        <h2>New Intro Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company}</p>
        ${website ? `<p><strong>Website:</strong> ${website}</p>` : ""}
        ${role ? `<p><strong>Role:</strong> ${role}</p>` : ""}
        ${stage ? `<p><strong>Stage:</strong> ${stage}</p>` : ""}
        <p><strong>Interested in:</strong> ${interestedIn.join(", ")}</p>
        <p><strong>Problem:</strong> ${problem}</p>
        ${whyFit ? `<p><strong>Why it's a fit:</strong> ${whyFit}</p>` : ""}
        <hr>
        <p><small>Submitted: ${new Date().toISOString()}</small></p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
