import { fulfillCheckoutSession } from "@/app/lib/checkoutFulfillment";
import db from "@/app/lib/db";
import { recordStripeRefund } from "@/app/lib/stripeRefunds";
import { upsertConnectAccount } from "@/app/lib/stripeConnect";
import Stripe from "stripe";
import type { RowDataPacket } from "mysql2";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await fulfillCheckoutSession(session.id);
  }

  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;

    await fulfillCheckoutSession(session.id);
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const userId =
      Number(account.metadata?.launchpad_user_id || 0) ||
      (await getUserIdForConnectAccount(account.id));

    if (userId) {
      await upsertConnectAccount(userId, account);
    }
  }

  if (event.type === "refund.created" || event.type === "refund.updated") {
    const refund = event.data.object as Stripe.Refund;

    await recordStripeRefund({
      refund,
      rawEvent: event,
    });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;

    for (const refund of charge.refunds?.data || []) {
      await recordStripeRefund({
        refund,
        rawEvent: event,
      });
    }
  }

  return new Response("OK");
}

async function getUserIdForConnectAccount(accountId: string) {
  const [rows] = await db.execute<(RowDataPacket & { user_id: number })[]>(
    `
    SELECT user_id
    FROM stripe_connect_accounts
    WHERE stripe_account_id = ?
    LIMIT 1
    `,
    [accountId]
  );

  return rows[0]?.user_id || null;
}
