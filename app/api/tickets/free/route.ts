import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { issueAdmissionTickets } from "@/app/lib/eventDayTickets";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type EventRow = RowDataPacket & {
  ticket_price: number | string;
};

type UserRow = RowDataPacket & {
  name: string | null;
  email: string;
  phone: string | null;
};

export async function POST(request: Request) {
  const session = await auth();
  const userId = Number((session?.user as { id?: unknown } | undefined)?.id || 0);
  const role = String(
    (session?.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();

  if (!session?.user || !Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  if (role !== "customer") {
    return NextResponse.json(
      { error: "Only customer accounts can claim free public tickets." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const eventId = Number(body.event_id);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const [eventRows] = await db.execute<EventRow[]>(
    "SELECT ticket_price FROM events WHERE id = ? LIMIT 1",
    [eventId]
  );

  if (!eventRows.length) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const authoritativePrice = Number(eventRows[0].ticket_price || 0);

  if (authoritativePrice !== 0) {
    return NextResponse.json(
      { error: "This event requires paid checkout." },
      { status: 403 }
    );
  }

  const [userRows] = await db.execute<UserRow[]>(
    "SELECT name, email, phone FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  const customer = userRows[0];

  const result = await issueAdmissionTickets({
    eventId,
    quantity: 1,
    customerName: customer?.name || session.user.name || "Guest",
    customerEmail: customer?.email || session.user.email || "",
    customerPhone: customer?.phone || "",
    smsConsent: false,
    amountPaid: 0,
    totalCharged: 0,
    paymentMethod: "none",
    saleChannel: "free",
    ticketType: "free",
    issuedByUserId: null,
  });

  return NextResponse.json({
    success: true,
    eventName: result.event.event_name,
    tickets: result.tickets.map(ticket => ({ ticketNumber: ticket.ticketNumber, qrCode: ticket.qrCode })),
    ticketLink: result.ticketLink,
    delivery: result.delivery,
  });
}
