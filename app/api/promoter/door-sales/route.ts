import {
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import { issueAdmissionTickets } from "@/app/lib/eventDayTickets";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type EventRow = RowDataPacket & {
  ticket_price: number | string;
};

export async function POST(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    event_id,
    customer_name,
    customer_email,
    customer_phone,
    quantity,
    payment_method,
    sms_consent,
  } = await request.json();

  const eventId = Number(event_id);
  const ticketQuantity = Number(quantity || 1);
  const paymentMethod = String(payment_method || "cash").toLowerCase();
  const customerName = String(customer_name || "Guest").trim() || "Guest";
  const customerEmail = String(customer_email || "").trim();
  const customerPhone = String(customer_phone || "").trim();

  if (customerName.length < 2) {
    return NextResponse.json({ error: "Enter the customer name." }, { status: 400 });
  }
  if (!customerPhone) {
    return NextResponse.json({ error: "Enter the customer's mobile number for ticket delivery." }, { status: 400 });
  }
  if (sms_consent !== true) return NextResponse.json({ error: "Confirm the customer's consent to receive the ticket text." }, { status: 400 });

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isInteger(ticketQuantity) ||
    ticketQuantity < 1 ||
    ticketQuantity > 10
  ) {
    return NextResponse.json(
      { error: "Please choose an event and valid quantity." },
      { status: 400 }
    );
  }

  if (paymentMethod !== "cash" && paymentMethod !== "card") {
    return NextResponse.json(
      { error: "Payment method must be cash or card." },
      { status: 400 }
    );
  }

  if (!(await canAccessEvent(user, eventId, "sell"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [eventRows] = await db.execute<EventRow[]>(
    "SELECT ticket_price FROM events WHERE id = ? LIMIT 1",
    [eventId]
  );

  if (!eventRows.length) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const ticketPrice = Number(eventRows[0].ticket_price || 0);
  const result = await issueAdmissionTickets({
    eventId,
    quantity: ticketQuantity,
    customerName,
    customerEmail,
    customerPhone,
    smsConsent: true,
    amountPaid: ticketPrice,
    totalCharged: ticketPrice,
    paymentMethod: paymentMethod as "cash" | "card",
    saleChannel: "door",
    ticketType: paymentMethod === "cash" ? "cash" : "paid",
    issuedByUserId: user.id,
  });

  return NextResponse.json({
    success: true,
    eventName: result.event.event_name,
    tickets: result.tickets.map((ticket) => ({
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
    })),
    ticketNumbers: result.tickets.map((ticket) => ticket.ticketNumber),
    ticketLink: result.ticketLink,
    delivery: result.delivery,
  });
}
