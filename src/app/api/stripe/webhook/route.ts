import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { query } from "@/lib/db";
import { sendHunterWelcomeEmail } from "@/lib/hunter-emails";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Map Stripe subscription status to our internal status
function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "paid"; // still in the system but payment issue — keep access, we'll follow up
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    case "incomplete":
      return "paid";
    default:
      return "paid";
  }
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const signupId = Number(sub.metadata?.hunter_signup_id || 0);
  if (!signupId) return;

  const status = mapSubscriptionStatus(sub.status);
  // current_period_end moved around across API versions — pick whatever exists at runtime
  const subAny = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const endEpoch =
    subAny.current_period_end ??
    subAny.items?.data?.[0]?.current_period_end ??
    0;
  const currentPeriodEnd = endEpoch ? new Date(endEpoch * 1000) : null;

  await query(
    `UPDATE hunter_signups
     SET status = $1,
         stripe_subscription_id = $2,
         stripe_customer_id = $3,
         current_period_end = $4,
         cancel_at_period_end = $5,
         updated_at = NOW()
     WHERE id = $6`,
    [
      status,
      sub.id,
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      currentPeriodEnd,
      sub.cancel_at_period_end,
      signupId,
    ]
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const signupId = Number(session.metadata?.hunter_signup_id || 0);
  if (!signupId) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  await query(
    `UPDATE hunter_signups
     SET status = 'paid',
         stripe_subscription_id = COALESCE($1, stripe_subscription_id),
         stripe_customer_id = COALESCE($2, stripe_customer_id),
         last_paid_at = NOW(),
         updated_at = NOW()
     WHERE id = $3`,
    [subscriptionId || null, customerId || null, signupId]
  );

  // Fire Day-0 welcome email
  await sendHunterWelcomeEmail(signupId);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Cast to any — the `subscription` property exists at runtime but isn't in
  // the latest SDK type (moved to invoice.parent in newer API versions)
  const invAny = invoice as unknown as {
    subscription?: string | { id: string };
    parent?: { subscription_details?: { subscription?: string | { id: string } } };
  };
  const subRaw =
    invAny.subscription ??
    invAny.parent?.subscription_details?.subscription;
  const subId = typeof subRaw === "string" ? subRaw : subRaw?.id;
  if (!subId) return;

  await query(
    `UPDATE hunter_signups
     SET status = CASE WHEN status IN ('cancelled','refunded') THEN status ELSE 'active' END,
         last_paid_at = NOW(),
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subId]
  );
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await query(
    `UPDATE hunter_signups
     SET status = 'cancelled', updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [sub.id]
  );
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  const bodyText = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe webhook verification failed:", msg);
    return NextResponse.json(
      { error: `Webhook verification failed: ${msg}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        // Ignore other events
        break;
    }
  } catch (e) {
    console.error("Error handling Stripe webhook event", event.type, e);
    // Return 200 so Stripe doesn't retry — log and fix forward
  }

  return NextResponse.json({ received: true });
}
