import db from "@/app/lib/db";
import {
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type TicketRow = RowDataPacket & {
  id: number;
  event_id: number | null;
  used: number;
};

export async function POST(req: Request) {
  try {
    const user = await getEventDayUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      ticketNumber,
      eventId,
      deviceId,
      scanUuid,
    } = await req.json();
    const normalizedTicketNumber = String(ticketNumber || "").trim();
    const targetEventId = Number(eventId);

    if (
      !normalizedTicketNumber ||
      !Number.isInteger(targetEventId) ||
      targetEventId <= 0
    ) {
      return NextResponse.json(
        {
          valid: false,
          message: "Choose an event and enter a ticket number.",
        },
        { status: 400 }
      );
    }

    if (!(await canAccessEvent(user, targetEventId, "scan"))) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const [rows] = await db.execute<TicketRow[]>(
      `
      SELECT *
      FROM orders
      WHERE ticket_number = ?
        AND event_id = ?
      LIMIT 1
      `,
      [normalizedTicketNumber, targetEventId]
    );

    if (rows.length === 0) {
      await logScan({
        scanUuid,
        eventId: targetEventId,
        orderId: null,
        ticketNumber: normalizedTicketNumber,
        userId: user.id,
        deviceId,
        status: "not_found",
        conflictReason: "Ticket not found for selected event.",
      });

      return NextResponse.json({
        valid: false,
        message: "Ticket not found.",
      });
    }

    if (rows[0].used === 1) {
      await logScan({
        scanUuid,
        eventId: targetEventId,
        orderId: rows[0].id,
        ticketNumber: normalizedTicketNumber,
        userId: user.id,
        deviceId,
        status: "already_used",
        conflictReason: "Ticket was already checked in.",
      });

      return NextResponse.json({
        valid: false,
        message: "Ticket already used.",
      });
    }

    const [result] = await db.execute<ResultSetHeader>(
      `
      UPDATE orders
      SET
        used = 1,
        checked_in_at = NOW(),
        checked_in_by_user_id = ?,
        checked_in_device_id = ?
      WHERE ticket_number = ?
        AND event_id = ?
        AND used = 0
      `,
      [
        user.id,
        String(deviceId || "").slice(0, 100) || null,
        normalizedTicketNumber,
        targetEventId,
      ]
    );

    if (result.affectedRows !== 1) {
      await logScan({
        scanUuid,
        eventId: targetEventId,
        orderId: rows[0].id,
        ticketNumber: normalizedTicketNumber,
        userId: user.id,
        deviceId,
        status: "already_used",
        conflictReason: "Ticket was checked in by another request.",
      });

      return NextResponse.json({
        valid: false,
        message: "Ticket already used.",
      });
    }

    await logScan({
      scanUuid,
      eventId: targetEventId,
      orderId: rows[0].id,
      ticketNumber: normalizedTicketNumber,
      userId: user.id,
      deviceId,
      status: "accepted",
      conflictReason: null,
    });

    return NextResponse.json({
      valid: true,
      ticket: rows[0],
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Server error";

    return NextResponse.json(
      {
        valid: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

async function logScan({
  scanUuid,
  eventId,
  orderId,
  ticketNumber,
  userId,
  deviceId,
  status,
  conflictReason,
}: {
  scanUuid?: string;
  eventId: number;
  orderId: number | null;
  ticketNumber: string;
  userId: number;
  deviceId?: string;
  status: string;
  conflictReason: string | null;
}) {
  const uuid = String(scanUuid || randomUUID()).slice(0, 100);

  await db.execute(
    `
    INSERT IGNORE INTO ticket_scan_events
      (
        scan_uuid,
        event_id,
        order_id,
        ticket_number,
        scanned_by_user_id,
        device_id,
        scan_mode,
        scan_status,
        conflict_reason,
        scanned_at,
        synced_at
      )
    VALUES (?, ?, ?, ?, ?, ?, 'online', ?, ?, NOW(), NULL)
    `,
    [
      uuid,
      eventId,
      orderId,
      ticketNumber,
      userId,
      String(deviceId || "").slice(0, 100) || null,
      status,
      conflictReason,
    ]
  );
}
