import {
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import { issueAdmissionTickets } from "@/app/lib/eventDayTickets";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const eventId = Number(body.event_id);
  const quantity = Number(body.quantity || 1);
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

  if (!(await canAccessEvent(user, eventId, "comp"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await issueAdmissionTickets({
    eventId,
    quantity,
    customerName,
    customerEmail,
    customerPhone,
    smsConsent: body.sms_consent === "on" || body.sms_consent === true,
    amountPaid: 0,
    totalCharged: 0,
    paymentMethod: "none",
    saleChannel: "comp",
    ticketType: "comp",
    issuedByUserId: user.id,
  });

  return NextResponse.json({
    success: true,
    eventName: result.event.event_name,
    tickets: result.tickets.map(ticket => ({ ticketNumber: ticket.ticketNumber, qrCode: ticket.qrCode })),
    ticketLink: result.ticketLink,
    delivery: result.delivery,
  });
}
