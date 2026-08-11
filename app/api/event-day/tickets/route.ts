import {
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import { issueAdmissionTickets } from "@/app/lib/eventDayTickets";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type EventPriceRow = RowDataPacket & {
  ticket_price: number | string;
};

export async function POST(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const eventId = Number(body.event_id);
  const quantity = Number(body.quantity || 1);
  const saleChannel = String(body.sale_channel || "door");
  const paymentMethod = String(body.payment_method || "cash").toLowerCase();
  const customerName = String(body.customer_name || "Guest").trim() || "Guest";
  const customerEmail = String(body.customer_email || "").trim();
  const customerPhone = String(body.customer_phone || "").trim();

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 10
  ) {
    return NextResponse.json(
      { error: "Choose an event and valid ticket quantity." },
      { status: 400 }
    );
  }

  if (saleChannel !== "door" && saleChannel !== "mobile_presale") {
    return NextResponse.json({ error: "Invalid sale channel." }, { status: 400 });
  }

  if (paymentMethod !== "cash" && paymentMethod !== "card") {
    return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
  }

  if (!(await canAccessEvent(user, eventId, "sell"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [eventRows] = await db.execute<EventPriceRow[]>(
    "SELECT ticket_price FROM events WHERE id = ? LIMIT 1",
    [eventId]
  );

  if (!eventRows.length) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const ticketPrice = Number(eventRows[0].ticket_price || 0);

  if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
    return NextResponse.json(
      { error: "Event has an invalid ticket price." },
      { status: 400 }
    );
  }

  const result = await issueAdmissionTickets({
    eventId,
    quantity,
    customerName,
    customerEmail,
    customerPhone,
    amountPaid: ticketPrice,
    totalCharged: ticketPrice,
    paymentMethod: paymentMethod as "cash" | "card",
    saleChannel: saleChannel as "door" | "mobile_presale",
    ticketType: paymentMethod === "cash" ? "cash" : "paid",
    issuedByUserId: user.id,
  });

  return NextResponse.json({
    success: true,
    eventName: result.event.event_name,
    tickets: result.tickets,
  });
}
