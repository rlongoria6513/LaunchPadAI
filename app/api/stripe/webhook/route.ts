import Stripe from "stripe";
import db from "@/app/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("Missing webhook secret", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const eventName =
      session.metadata?.event_name || "Unknown Event";

    const quantity =
      Number(session.metadata?.quantity || 1);

    const ticketPrice =
      Number(session.metadata?.ticket_price || 0);

    const customerName =
      session.customer_details?.name || "Guest";

    const customerEmail =
      session.customer_details?.email || "";

    const customerPhone =
      session.customer_details?.phone || "";

    await db.execute(
      `INSERT IGNORE INTO orders (
        stripe_session_id,
        customer_name,
        customer_email,
        customer_phone,
        event_name,
        quantity,
        amount_paid,
        payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        customerName,
        customerEmail,
        customerPhone,
        eventName,
        quantity,
        ticketPrice * quantity,
        session.payment_status,
      ]
    );
  }

  return new Response("Webhook received", { status: 200 });
}