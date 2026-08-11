import {
  accessibleEventsWhere,
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type ItemRow = RowDataPacket & {
  id: number;
  event_id: number;
  event_name: string;
  name: string;
  price: number | string;
  active: number | boolean;
};

export async function GET() {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = accessibleEventsWhere(user);
  const [items] = await db.execute<ItemRow[]>(
    `
    SELECT
      m.id,
      m.event_id,
      e.event_name,
      m.name,
      m.price,
      m.active
    FROM event_merchandise_items m
    INNER JOIN events e
      ON m.event_id = e.id
    WHERE ${where.sql}
    ORDER BY e.event_date ASC, m.name ASC
    `,
    where.params
  );

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      eventId: item.event_id,
      eventName: item.event_name,
      name: item.name,
      price: Number(item.price || 0),
      active: Boolean(item.active),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const eventId = Number(body.event_id);
  const name = String(body.name || "").trim();
  const price = Number(body.price);

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !name ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return NextResponse.json(
      { error: "Enter an item name, event, and valid price." },
      { status: 400 }
    );
  }

  if (!(await canAccessEvent(user, eventId, "sell"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO event_merchandise_items
      (event_id, name, price, active, created_by_user_id)
    VALUES (?, ?, ?, 1, ?)
    `,
    [eventId, name, price, user.id]
  );

  return NextResponse.json({
    success: true,
    item: {
      id: result.insertId,
      eventId,
      name,
      price,
      active: true,
    },
  });
}
