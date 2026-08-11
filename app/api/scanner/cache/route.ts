import {
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type TicketRow = RowDataPacket & {
  id: number;
  ticket_number: string;
  used: number | boolean;
};

export async function GET(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = Number(searchParams.get("eventId"));

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  if (!(await canAccessEvent(user, eventId, "scan"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [tickets] = await db.execute<TicketRow[]>(
    `
    SELECT id, ticket_number, used
    FROM orders
    WHERE event_id = ?
      AND LOWER(payment_status) = 'paid'
      AND ticket_number IS NOT NULL
    ORDER BY id ASC
    `,
    [eventId]
  );

  return NextResponse.json({
    eventId,
    cachedAt: new Date().toISOString(),
    tickets: tickets.map((ticket) => ({
      orderId: ticket.id,
      ticketNumber: ticket.ticket_number,
      used: Boolean(ticket.used),
    })),
  });
}
