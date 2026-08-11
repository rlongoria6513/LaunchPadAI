import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { sendTicketEmail } from "@/app/lib/email";
import { generateTicketPDF } from "@/app/lib/pdf";
import { generateQRCode } from "@/app/lib/qrcode";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  venue: string | null;
  event_date: string | Date | null;
  event_time: string | null;
  ticket_price: number | string;
  image_url: string | null;
};

export async function POST(request: Request) {
  const session = await auth();
  const role = String(
    (session?.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();

  if (!session || (role !== "promoter" && role !== "admin")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const {
    event_id,
    customer_name,
    customer_email,
    customer_phone,
    quantity,
  } = await request.json();

  const eventId = Number(event_id);
  const ticketQuantity = Number(quantity || 1);
  const customerName = String(customer_name || "Guest").trim() || "Guest";
  const customerEmail = String(customer_email || "").trim();
  const customerPhone = String(customer_phone || "").trim();

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isInteger(ticketQuantity) ||
    ticketQuantity < 1 ||
    ticketQuantity > 4
  ) {
    return NextResponse.json(
      { error: "Please choose an event and valid quantity." },
      { status: 400 }
    );
  }

  const [eventRows] = await db.execute<EventRow[]>(
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
    [eventId]
  );

  if (!eventRows.length) {
    return NextResponse.json(
      { error: "Event not found." },
      { status: 404 }
    );
  }

  const event = eventRows[0];
  const ticketPrice = Number(event.ticket_price || 0);
  const serviceFee = 0;
  const ticketNumbers: string[] = [];
  const doorSaleId =
    "door-" +
    Date.now() +
    "-" +
    Math.floor(Math.random() * 1000000);

  try {
    for (let i = 0; i < ticketQuantity; i++) {
      const ticketNumber =
        "LP-" +
        Date.now() +
        "-" +
        i +
        "-" +
        Math.floor(Math.random() * 1000000);

      await db.execute<ResultSetHeader>(
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
          `${doorSaleId}-${i}`,
          customerName,
          customerEmail,
          customerPhone,
          event.id,
          event.event_name,
          1,
          ticketPrice,
          serviceFee,
          ticketPrice,
          "paid",
          ticketNumber,
          0,
        ]
      );

      ticketNumbers.push(ticketNumber);

      if (customerEmail) {
        const qrCode = await generateQRCode(ticketNumber);
        const pdf = await generateTicketPDF({
          customerName,
          eventName: event.event_name,
          ticketNumber,
          imageUrl: event.image_url || "",
          qrCode,
          venue: event.venue || "",
          eventDate: String(event.event_date || ""),
          eventTime: event.event_time || "",
        });

        await sendTicketEmail({
          to: customerEmail,
          name: customerName,
          eventName: event.event_name,
          ticketNumber,
          qrCode,
          imageUrl: event.image_url || "",
          pdf,
        });
      }
    }

    return NextResponse.json({
      success: true,
      ticketNumbers,
    });
  } catch (error) {
    console.error("Door sale error:", error);

    return NextResponse.json(
      { error: "Could not create this door-sale ticket." },
      { status: 500 }
    );
  }
}
