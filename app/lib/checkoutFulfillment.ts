import { sendTicketEmail } from "@/app/lib/email";
import { generateTicketPDF } from "@/app/lib/pdf";
import { generateQRCode } from "@/app/lib/qrcode";
import db from "@/app/lib/db";
import { createHash } from "crypto";
import {
  deliverTicketText,
  ensureTicketLink,
  logEmailDelivery,
  type DeliveryStatus,
} from "@/app/lib/ticketDelivery";
import Stripe from "stripe";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type LockRow = RowDataPacket & {
  lock_result: number | null;
};

type ExistingTicketRow = RowDataPacket & {
  id: number;
  ticket_number: string;
};

type EventRow = RowDataPacket & {
  image_url: string | null;
  venue: string | null;
  event_date: string | Date | null;
  event_time: string | null;
};

type CreatedTicket = {
  orderId: number;
  ticketNumber: string;
  qrCode: string;
};

type StripePaymentDetails = {
  paymentIntentId: string | null;
  chargeId: string | null;
  applicationFeeId: string | null;
  transferId: string | null;
  connectedAccountId: string | null;
};

export type CheckoutFulfillmentResult = {
  session: Stripe.Checkout.Session;
  fulfilled: boolean;
  created: boolean;
  paymentStatus: Stripe.Checkout.Session.PaymentStatus | null;
  ticketNumbers: string[];
  ticketLink?: string;
  delivery?: DeliveryStatus;
};

export async function fulfillCheckoutSession(
  sessionId: string
): Promise<CheckoutFulfillmentResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentStatus = session.payment_status || null;

  if (paymentStatus !== "paid") {
    return {
      session,
      fulfilled: false,
      created: false,
      paymentStatus,
      ticketNumbers: [],
    };
  }

  const connection = await db.getConnection();
  const createdTickets: CreatedTicket[] = [];

  try {
    const lockName = `launchpad:checkout:${createHash("sha256")
      .update(session.id)
      .digest("hex")
      .slice(0, 40)}`;
    const [lockRows] = await connection.execute<LockRow[]>(
      "SELECT GET_LOCK(?, 10) AS lock_result",
      [lockName]
    );

    if (lockRows[0]?.lock_result !== 1) {
      throw new Error("Could not acquire checkout fulfillment lock.");
    }

    try {
      const existingTickets = await getExistingTickets(
        connection,
        session.id
      );

      if (existingTickets.length) {
        let delivered: Awaited<ReturnType<typeof finishCheckoutDelivery>> | null = null;
        try { delivered = await finishCheckoutDelivery({ session, tickets: existingTickets }); }
        catch (error) { console.error("Existing checkout delivery recovery failed:", error); }
        return {
          session,
          fulfilled: true,
          created: false,
          paymentStatus,
          ticketNumbers: existingTickets.map(ticket => ticket.ticketNumber),
          ticketLink: delivered?.link.path,
          delivery: delivered?.delivery || { sms: "failed", message: "Delivery is temporarily unavailable. Your tickets are displayed below." },
        };
      }

      await connection.beginTransaction();

      try {
        const eventId = Number(session.metadata?.event_id || 0);
        const eventName =
          session.metadata?.event_name || "Unknown Event";
        const quantity = Number(session.metadata?.quantity || 1);
        const ticketPrice = Number(
          session.metadata?.ticket_price || 0
        );
        const serviceFee = Number(
          session.metadata?.service_fee || 2
        );
        const totalCharged = ticketPrice + serviceFee;
        const eventDetails = await getEventDetails(
          connection,
          eventId
        );
        const stripePaymentDetails =
          await getStripePaymentDetails(session);

        for (let i = 0; i < quantity; i++) {
          const ticketNumber =
            "LP-" +
            Date.now() +
            "-" +
            i +
            "-" +
            Math.floor(Math.random() * 1000000);

          const [insert] = await connection.execute<ResultSetHeader>(
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
              used,
              payment_method,
              sale_channel,
              ticket_type,
              issued_at,
              stripe_payment_intent_id,
              stripe_charge_id,
              stripe_connected_account_id,
              stripe_application_fee_id,
              stripe_transfer_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)
            `,
            [
              session.id,
              session.customer_details?.name || session.metadata?.guest_name || "Guest",
              session.customer_details?.email || session.customer_email || session.metadata?.guest_email || "",
              session.customer_details?.phone || session.metadata?.guest_phone || "",
              eventId,
              eventName,
              1,
              ticketPrice,
              serviceFee,
              totalCharged,
              paymentStatus,
              ticketNumber,
              0,
              "stripe",
              "online",
              "paid",
              stripePaymentDetails.paymentIntentId,
              stripePaymentDetails.chargeId,
              stripePaymentDetails.connectedAccountId,
              stripePaymentDetails.applicationFeeId,
              stripePaymentDetails.transferId,
            ]
          );

          const qrCode = await generateQRCode(ticketNumber);

          createdTickets.push({
            orderId: insert.insertId,
            ticketNumber,
            qrCode,
          });
        }

        await connection.commit();

        let ticketLink: string | undefined;
        let delivery: DeliveryStatus = { sms: "failed", message: "Delivery is temporarily unavailable. Your tickets are displayed below." };
        try {
          const deliveryLink = await ensureTicketLink(`stripe:${session.id}`, createdTickets.map(ticket => ticket.orderId));
          ticketLink = deliveryLink.path;
          await sendCreatedTicketEmails({ session, eventName, eventDetails, createdTickets, linkId: deliveryLink.id, ticketUrl: deliveryLink.url });
          delivery = await deliverTicketText({ linkId: deliveryLink.id, publicId: deliveryLink.publicId, phone: session.customer_details?.phone || session.metadata?.guest_phone || "", eventName, idempotencyKey: `stripe:${session.id}:sms:initial` });
        } catch (error) { console.error("Checkout delivery failed after ticket creation:", error); }

        return {
          session,
          fulfilled: true,
          created: true,
          paymentStatus,
          ticketNumbers: createdTickets.map(
            (ticket) => ticket.ticketNumber
          ),
          ticketLink,
          delivery,
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    } finally {
      await connection.execute("SELECT RELEASE_LOCK(?)", [lockName]);
    }
  } finally {
    connection.release();
  }
}

async function getStripePaymentDetails(
  session: Stripe.Checkout.Session
): Promise<StripePaymentDetails> {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  if (!paymentIntentId) {
    return {
      paymentIntentId: null,
      chargeId: null,
      applicationFeeId: null,
      transferId: null,
      connectedAccountId:
        session.metadata?.stripe_connected_account_id || null,
    };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    paymentIntentId,
    {
      expand: ["latest_charge", "latest_charge.application_fee", "latest_charge.transfer"],
    }
  );
  const latestCharge = paymentIntent.latest_charge;
  const charge =
    typeof latestCharge === "string" ? null : latestCharge || null;
  const applicationFee = charge?.application_fee;
  const transfer = charge?.transfer;

  return {
    paymentIntentId,
    chargeId: charge?.id || null,
    applicationFeeId:
      typeof applicationFee === "string"
        ? applicationFee
        : applicationFee?.id || null,
    transferId:
      typeof transfer === "string" ? transfer : transfer?.id || null,
    connectedAccountId:
      session.metadata?.stripe_connected_account_id || null,
  };
}

async function getExistingTickets(
  connection: PoolConnection,
  sessionId: string
) {
  const [rows] = await connection.execute<ExistingTicketRow[]>(
    `
    SELECT id, ticket_number
    FROM orders
    WHERE stripe_session_id = ?
    ORDER BY id ASC
    `,
    [sessionId]
  );

  return rows.map((row) => ({ orderId: Number(row.id), ticketNumber: row.ticket_number, qrCode: "" }));
}

async function getEventDetails(
  connection: PoolConnection,
  eventId: number
) {
  const [rows] = await connection.execute<EventRow[]>(
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

  return {
    imageUrl: rows[0]?.image_url || "",
    venue: rows[0]?.venue || "",
    eventDate: rows[0]?.event_date || "",
    eventTime: rows[0]?.event_time || "",
  };
}

async function sendCreatedTicketEmails({
  session,
  eventName,
  eventDetails,
  createdTickets,
  linkId,
  ticketUrl,
}: {
  session: Stripe.Checkout.Session;
  eventName: string;
  eventDetails: Awaited<ReturnType<typeof getEventDetails>>;
  createdTickets: CreatedTicket[];
  linkId: number;
  ticketUrl: string;
}) {
  const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.guest_email;

  if (!customerEmail) {
    return;
  }

  const customerName =
    session.customer_details?.name || session.metadata?.guest_name || "Guest";

  for (const ticket of createdTickets) {
    try {
      const pdf = await generateTicketPDF({
        customerName,
        eventName,
        ticketNumber: ticket.ticketNumber,
        imageUrl: eventDetails.imageUrl,
        qrCode: ticket.qrCode,
        venue: eventDetails.venue,
        eventDate: String(eventDetails.eventDate),
        eventTime: eventDetails.eventTime,
      });

      await sendTicketEmail({
        to: customerEmail,
        name: customerName,
        eventName,
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        imageUrl: eventDetails.imageUrl,
        pdf,
        mobileTicketUrl: ticketUrl,
      });
      await logEmailDelivery({ linkId, orderId: ticket.orderId, email: customerEmail, status: "sent", idempotencyKey: `stripe:${session.id}:email:${ticket.orderId}` });
    } catch (error) {
      console.error("Ticket email fulfillment failed:", error);
      await logEmailDelivery({ linkId, orderId: ticket.orderId, email: customerEmail, status: "failed", error: error instanceof Error ? error.message : "Email failed", idempotencyKey: `stripe:${session.id}:email:${ticket.orderId}` }).catch(() => undefined);
    }
  }
}

async function finishCheckoutDelivery({ session, tickets }: { session: Stripe.Checkout.Session; tickets: CreatedTicket[] }) {
  const link = await ensureTicketLink(`stripe:${session.id}`, tickets.map(ticket => ticket.orderId));
  const delivery = await deliverTicketText({
    linkId: link.id,
    publicId: link.publicId,
    phone: session.customer_details?.phone || session.metadata?.guest_phone || "",
    eventName: session.metadata?.event_name || "",
    idempotencyKey: `stripe:${session.id}:sms:initial`,
  });
  return { link, delivery };
}
