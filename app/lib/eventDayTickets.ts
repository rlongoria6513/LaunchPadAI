import db from "@/app/lib/db";
import { sendTicketEmail } from "@/app/lib/email";
import { generateTicketPDF } from "@/app/lib/pdf";
import { generateQRCode } from "@/app/lib/qrcode";
import { generateTicketNumber } from "@/app/lib/ticket";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  venue: string | null;
  event_date: string | Date | null;
  event_time: string | null;
  ticket_price: number | string;
  image_url: string | null;
};

export type IssuedTicket = {
  orderId: number;
  ticketNumber: string;
  qrCode: string;
};

export type IssueTicketsInput = {
  eventId: number;
  quantity: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amountPaid: number;
  totalCharged: number;
  paymentMethod: "cash" | "card" | "none";
  saleChannel: "door" | "mobile_presale" | "free" | "comp";
  ticketType: "cash" | "paid" | "free" | "comp";
  issuedByUserId?: number | null;
};

export async function issueAdmissionTickets(input: IssueTicketsInput) {
  const connection = await db.getConnection();
  const tickets: IssuedTicket[] = [];

  try {
    await connection.beginTransaction();

    const [eventRows] = await connection.execute<EventRow[]>(
      `
      SELECT
        id,
        event_name,
        venue,
        event_date,
        event_time,
        ticket_price,
        image_url
      FROM events
      WHERE id = ?
      LIMIT 1
      `,
      [input.eventId]
    );

    if (!eventRows.length) {
      throw new Error("Event not found.");
    }

    const event = eventRows[0];

    for (let index = 0; index < input.quantity; index += 1) {
      const inserted = await insertTicketWithUniqueNumber({
        connection,
        event,
        input,
      });
      const qrCode = await generateQRCode(inserted.ticketNumber);

      tickets.push({
        orderId: inserted.orderId,
        ticketNumber: inserted.ticketNumber,
        qrCode,
      });
    }

    await connection.commit();

    if (input.customerEmail) {
      await emailIssuedTickets({
        event: eventRows[0],
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        tickets,
      });
    }

    return {
      event: eventRows[0],
      tickets,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function insertTicketWithUniqueNumber({
  connection,
  event,
  input,
}: {
  connection: PoolConnection;
  event: EventRow;
  input: IssueTicketsInput;
}) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const ticketNumber = generateTicketNumber();

    try {
        const [result] = await connection.execute<ResultSetHeader>(
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
          issued_by_user_id,
          issued_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          null,
          input.customerName || "Guest",
          input.customerEmail || "",
          input.customerPhone || "",
          event.id,
          event.event_name,
          1,
          input.amountPaid,
          0,
          input.totalCharged,
          "paid",
          ticketNumber,
          0,
          input.paymentMethod,
          input.saleChannel,
          input.ticketType,
          input.issuedByUserId || null,
        ]
      );

        return {
          orderId: result.insertId,
          ticketNumber,
        };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "ER_DUP_ENTRY"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not create a unique ticket number.");
}

async function emailIssuedTickets({
  event,
  customerName,
  customerEmail,
  tickets,
}: {
  event: EventRow;
  customerName: string;
  customerEmail: string;
  tickets: IssuedTicket[];
}) {
  for (const ticket of tickets) {
    try {
      const pdf = await generateTicketPDF({
        customerName,
        eventName: event.event_name,
        ticketNumber: ticket.ticketNumber,
        imageUrl: event.image_url || "",
        qrCode: ticket.qrCode,
        venue: event.venue || "",
        eventDate: String(event.event_date || ""),
        eventTime: event.event_time || "",
      });

      await sendTicketEmail({
        to: customerEmail,
        name: customerName,
        eventName: event.event_name,
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        imageUrl: event.image_url || "",
        pdf,
      });
    } catch (error) {
      console.error("Event-Day ticket email failed:", error);
    }
  }
}
