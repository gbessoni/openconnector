import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Use client-side Firebase SDK for Firestore writes (no service account needed)
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

function getDb() {
  if (getApps().length === 0) {
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return getFirestore();
}

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

    // Save to Firestore
    const submission = {
      name,
      email,
      company,
      website: website || "",
      role: role || "",
      stage: stage || "",
      problem,
      whyFit: whyFit || "",
      interestedIn,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    const db = getDb();
    const docRef = await addDoc(collection(db, "intro-requests"), submission);

    // Send email notification
    const resendKey = process.env.RESEND_API_KEY;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (resendKey && notificationEmail) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "OpenConnector <onboarding@resend.dev>",
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
          <p><small>Submission ID: ${docRef.id}</small></p>
        `,
      });
    }

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
