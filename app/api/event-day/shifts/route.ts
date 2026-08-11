import {
  accessibleEventsWhere,
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type ShiftRow = RowDataPacket & {
  id: number;
  event_id: number;
  event_name: string;
  status: string;
  opened_at: string | Date;
  closed_at: string | Date | null;
  opening_cash: number | string;
  closing_cash: number | string | null;
};

export async function GET() {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = accessibleEventsWhere(user);
  const [rows] = await db.execute<ShiftRow[]>(
    `
    SELECT
      s.id,
      s.event_id,
      e.event_name,
      s.status,
      s.opened_at,
      s.closed_at,
      s.opening_cash,
      s.closing_cash
    FROM box_office_shifts s
    INNER JOIN events e
      ON s.event_id = e.id
    WHERE ${where.sql}
    ORDER BY s.opened_at DESC
    LIMIT 20
    `,
    where.params
  );

  return NextResponse.json({
    shifts: rows.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      eventName: row.event_name,
      status: row.status,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      openingCash: Number(row.opening_cash || 0),
      closingCash:
        row.closing_cash === null ? null : Number(row.closing_cash || 0),
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
  const openingCash = Number(body.opening_cash || 0);

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isFinite(openingCash) ||
    openingCash < 0
  ) {
    return NextResponse.json(
      { error: "Choose an event and valid opening cash." },
      { status: 400 }
    );
  }

  if (!(await canAccessEvent(user, eventId, "sell"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO box_office_shifts
      (event_id, opened_by_user_id, status, opened_at, opening_cash)
    VALUES (?, ?, 'open', NOW(), ?)
    `,
    [eventId, user.id, openingCash]
  );

  return NextResponse.json({
    success: true,
    shiftId: result.insertId,
  });
}

export async function PATCH(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const shiftId = Number(body.shift_id);
  const closingCash = Number(body.closing_cash || 0);

  if (
    !Number.isInteger(shiftId) ||
    shiftId <= 0 ||
    !Number.isFinite(closingCash) ||
    closingCash < 0
  ) {
    return NextResponse.json(
      { error: "Choose a shift and valid closing cash." },
      { status: 400 }
    );
  }

  const [shiftRows] = await db.execute<(RowDataPacket & { event_id: number })[]>(
    "SELECT event_id FROM box_office_shifts WHERE id = ? LIMIT 1",
    [shiftId]
  );

  if (!shiftRows.length) {
    return NextResponse.json({ error: "Shift not found." }, { status: 404 });
  }

  if (!(await canAccessEvent(user, shiftRows[0].event_id, "sell"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.execute(
    `
    UPDATE box_office_shifts
    SET
      status = 'closed',
      closed_by_user_id = ?,
      closed_at = NOW(),
      closing_cash = ?
    WHERE id = ?
      AND status = 'open'
    LIMIT 1
    `,
    [user.id, closingCash, shiftId]
  );

  return NextResponse.json({ success: true });
}
