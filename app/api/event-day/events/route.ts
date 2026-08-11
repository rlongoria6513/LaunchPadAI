import {
  accessibleEventsWhere,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  venue: string;
  event_date: string | Date;
  event_time: string;
  ticket_price: number | string;
};

export async function GET() {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = accessibleEventsWhere(user);
  const [events] = await db.execute<EventRow[]>(
    `
    SELECT
      e.id,
      e.event_name,
      e.venue,
      e.event_date,
      e.event_time,
      e.ticket_price
    FROM events e
    WHERE ${where.sql}
    ORDER BY e.event_date ASC, e.event_time ASC
    `,
    where.params
  );

  return NextResponse.json({
    events: events.map((event) => ({
      id: event.id,
      eventName: event.event_name,
      venue: event.venue,
      eventDate: event.event_date,
      eventTime: event.event_time,
      ticketPrice: Number(event.ticket_price || 0),
    })),
  });
}
