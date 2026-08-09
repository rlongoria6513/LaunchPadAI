import { sendTicketEmail } from "@/app/lib/email";
import { generateQRCode } from "@/app/lib/qrcode";
import Stripe from "stripe";
import db from "@/app/lib/db";
import { generateTicketPDF } from "@/app/lib/pdf";

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

    // Prevent the same Stripe order from being processed twice
    const [existing]: any = await db.execute(
      "SELECT id FROM orders WHERE stripe_session_id = ? LIMIT 1",
      [session.id]
    );

    if (existing.length) {
      return new Response("Already processed");
    }

    const eventId = Number(session.metadata?.event_id || 0);
    const eventName =
      session.metadata?.event_name || "Unknown Event";

    const quantity = Number(session.metadata?.quantity || 1);

    const ticketPrice = Number(
      session.metadata?.ticket_price || 0
    );

    // LaunchPad fee PER ticket
    const serviceFee = Number(
      session.metadata?.service_fee || 2
    );

    // Amount customer pays PER ticket
    const totalCharged = ticketPrice + serviceFee;

    console.log("========== LAUNCHPAD SALE ==========");
    console.log("Event:", eventName);
    console.log("Event ID:", eventId);
    console.log("Quantity:", quantity);
    console.log("Ticket price:", ticketPrice);
    console.log("Service fee per ticket:", serviceFee);
    console.log("Total per ticket:", totalCharged);
    console.log(
      "LaunchPad fee total:",
      serviceFee * quantity
    );
    console.log(
      "Ticket revenue total:",
      ticketPrice * quantity
    );
    console.log(
      "Customer total:",
      totalCharged * quantity
    );
    console.log("====================================");

    const [eventRows]: any = await db.execute(
      `
      SELECT
        image_url,
        venue,
        event_date,
        event_time
      FROM events
      WHERE id = ?
      LIMIT 1
      `,
      [eventId]
    );

    const imageUrl = eventRows?.[0]?.image_url || "";
    const venue = eventRows?.[0]?.venue || "";
    const eventDate = eventRows?.[0]?.event_date || "";
    const eventTime = eventRows?.[0]?.event_time || "";

    // Create one digital ticket for each ticket purchased
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
          service_fee,
          total_charged,
          payment_status,
          ticket_number,
          used
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          session.id,
          session.customer_details?.name || "Guest",
          session.customer_details?.email || "",
          session.customer_details?.phone || "",
          eventId,
          eventName,
          1,

          // Promoter ticket revenue
          ticketPrice,

          // LaunchPad revenue
          serviceFee,

          // Customer total for this ticket
          totalCharged,

          session.payment_status,
          ticketNumber,
          0,
        ]
      );

      const qrCode = await generateQRCode(ticketNumber);

      const pdf = await generateTicketPDF({
        customerName:
          session.customer_details?.name || "Guest",
        eventName,
        ticketNumber,
        imageUrl,
        qrCode,
        venue,
        eventDate,
        eventTime,
      });

      if (session.customer_details?.email) {
        await sendTicketEmail({
          to: session.customer_details.email,
          name:
            session.customer_details?.name || "Guest",
          eventName,
          ticketNumber,
          qrCode,
          imageUrl,
          pdf,
        });
      }
    }
  }

  return new Response("OK");
}