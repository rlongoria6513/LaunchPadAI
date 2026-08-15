import { fulfillCheckoutSession } from "@/app/lib/checkoutFulfillment";
import db from "@/app/lib/db";
import { recordStripeRefund } from "@/app/lib/stripeRefunds";
import { upsertConnectAccount } from "@/app/lib/stripeConnect";
import Stripe from "stripe";
import type { RowDataPacket } from "mysql2";
import { addSubscriptionAudit, claimStripeEvent, saveCheckoutSession, updateInvoiceStatus, upsertStripeSubscription } from "@/app/lib/promoterSubscriptions";

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
    if (session.metadata?.checkout_type === "promoter_membership") {
      if (await claimStripeEvent(event)) {
        const userId=Number(session.metadata.launchpad_user_id||session.client_reference_id||0);
        await saveCheckoutSession(userId,session);
        const subscriptionId=typeof session.subscription==="string"?session.subscription:session.subscription?.id;
        if(subscriptionId){const subscription=await stripe.subscriptions.retrieve(subscriptionId);await upsertStripeSubscription(subscription,userId);}
        await addSubscriptionAudit({userId,type:event.type,status:"completed",summary:"Promoter membership Checkout completed."});
      }
    } else await fulfillCheckoutSession(session.id);
  }

  if (["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)) {
    if (await claimStripeEvent(event)) { const subscription=event.data.object as Stripe.Subscription; const userId=await upsertStripeSubscription(subscription); await addSubscriptionAudit({userId,type:event.type,status:subscription.status,summary:`Membership changed to ${subscription.status}.`}); }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    if (await claimStripeEvent(event)) { const invoice=event.data.object as Stripe.Invoice; const legacy=invoice as Stripe.Invoice&{subscription?:string|Stripe.Subscription|null}; const parent=(invoice as Stripe.Invoice&{parent?:{subscription_details?:{subscription?:string|Stripe.Subscription|null}}}).parent; const raw=legacy.subscription||parent?.subscription_details?.subscription; const subscriptionId=typeof raw==="string"?raw:raw?.id; if(subscriptionId){const subscription=await stripe.subscriptions.retrieve(subscriptionId);const userId=await upsertStripeSubscription(subscription);const failed=event.type==="invoice.payment_failed";await updateInvoiceStatus(subscriptionId,failed?"payment_failed":"paid",failed?"Stripe could not collect the membership payment.":undefined);await addSubscriptionAudit({userId,type:event.type,status:failed?"failed":"paid",summary:failed?"Membership invoice payment failed.":"Membership invoice paid."});} }
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
