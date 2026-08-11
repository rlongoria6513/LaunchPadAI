import { sendTicketEmail } from "@/app/lib/email";
import { generateTicketPDF } from "@/app/lib/pdf";
import { generateQRCode } from "@/app/lib/qrcode";
import db from "@/app/lib/db";
import { createHash } from "crypto";
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
  ticket_number: string;
};

type EventRow = RowDataPacket & {
  image_url: string | null;
  venue: string | null;
  event_date: string | Date | null;
  event_time: string | null;
};

type CreatedTicket = {
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
      const existingTicketNumbers = await getExistingTicketNumbers(
        connection,
        session.id
      );

      if (existingTicketNumbers.length) {
        return {
          session,
          fulfilled: true,
          created: false,
          paymentStatus,
          ticketNumbers: existingTicketNumbers,
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

          await connection.execute<ResultSetHeader>(
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
              session.customer_details?.name || "Guest",
              session.customer_details?.email || "",
              session.customer_details?.phone || "",
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
            ticketNumber,
            qrCode,
          });
        }

        await connection.commit();

        await sendCreatedTicketEmails({
          session,
          eventName,
          eventDetails,
          createdTickets,
        });

        return {
          session,
          fulfilled: true,
          created: true,
          paymentStatus,
          ticketNumbers: createdTickets.map(
            (ticket) => ticket.ticketNumber
          ),
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

async function getExistingTicketNumbers(
  connection: PoolConnection,
  sessionId: string
) {
  const [rows] = await connection.execute<ExistingTicketRow[]>(
    `
    SELECT ticket_number
    FROM orders
    WHERE stripe_session_id = ?
    ORDER BY id ASC
    `,
    [sessionId]
  );

  return rows.map((row) => row.ticket_number);
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
}: {
  session: Stripe.Checkout.Session;
  eventName: string;
  eventDetails: Awaited<ReturnType<typeof getEventDetails>>;
  createdTickets: CreatedTicket[];
}) {
  const customerEmail = session.customer_details?.email;

  if (!customerEmail) {
    return;
  }

  const customerName =
    session.customer_details?.name || "Guest";

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
      });
    } catch (error) {
      console.error("Ticket email fulfillment failed:", error);
    }
  }
}
