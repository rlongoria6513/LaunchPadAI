import Stripe from "stripe";
import db from "@/app/lib/db";

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
    console.error(err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("========== STRIPE WEBHOOK ==========");
    console.log(session.metadata);
    console.log("====================================");
    console.log("SESSION ID:", session.id);
    const [existing]: any = await db.execute(
  "SELECT id FROM orders WHERE stripe_session_id = ? LIMIT 1",
  [session.id]
);

if (existing.length) return new Response("Already processed");

    const eventId = Number(session.metadata?.event_id || 0);

    const eventName =
      session.metadata?.event_name || "Unknown Event";

    const quantity =
      Number(session.metadata?.quantity || 1);

    const ticketPrice =
      Number(session.metadata?.ticket_price || 0);

    for (let i = 0; i < quantity; i++) {
  const ticketNumber =
    "LP-" +
    Date.now() +
    "-" +
    i +
"-" +
Math.floor(Math.random() * 1000000);

  await db.execute(
      `
      INSERT INTO orders
(
  stripe_session_id,
  customer_name,
  customer_email,
  customer_phone,
  event_id,
  event_name,
  quantity,
  amount_paid,
  payment_status,
  ticket_number,
  used
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
  session.id,
  session.customer_details?.name || "Guest",
  session.customer_details?.email || "",
  session.customer_details?.phone || "",
  eventId,
  eventName,
  1,
  ticketPrice,
  session.payment_status,
  ticketNumber,
  0,
]
    );
  }
  }
  return new Response("OK");
  }