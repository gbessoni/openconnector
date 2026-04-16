import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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
    const { name, email, linkedin, industry, network, referral } = body;

    if (!name || !email || !linkedin || !network) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const submission = {
      name,
      email,
      linkedin,
      industry: industry || "",
      network,
      referral: referral || "",
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    const db = getDb();
    const docRef = await addDoc(collection(db, "referral-applications"), submission);

    const resendKey = process.env.RESEND_API_KEY;
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (resendKey && notificationEmail) {
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
          <p><small>Submission ID: ${docRef.id}</small></p>
        `,
      });
    }

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Referral application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
