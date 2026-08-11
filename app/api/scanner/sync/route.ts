import {
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type ExistingScanRow = RowDataPacket & {
  scan_status: string;
};

type TicketRow = RowDataPacket & {
  id: number;
  used: number | boolean;
};

type OfflineScan = {
  scan_uuid: string;
  event_id: number;
  ticket_number: string;
  device_id?: string;
  scanned_at: string;
};

export async function POST(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const scans = Array.isArray(body.scans) ? (body.scans as OfflineScan[]) : [];
  const results = [];

  for (const scan of scans.slice(0, 100)) {
    const scanUuid = String(scan.scan_uuid || "").slice(0, 100);
    const eventId = Number(scan.event_id);
    const ticketNumber = String(scan.ticket_number || "").trim();
    const deviceId = String(scan.device_id || "").slice(0, 100) || null;
    const scannedAt = parseScanDate(scan.scanned_at);

    if (
      !scanUuid ||
      !Number.isInteger(eventId) ||
      eventId <= 0 ||
      !ticketNumber ||
      !scannedAt
    ) {
      results.push({
        scanUuid,
        status: "invalid_payload",
      });
      continue;
    }

    if (!(await canAccessEvent(user, eventId, "scan"))) {
      results.push({
        scanUuid,
        ticketNumber,
        status: "forbidden",
      });
      continue;
    }

    const [existing] = await db.execute<ExistingScanRow[]>(
      `
      SELECT scan_status
      FROM ticket_scan_events
      WHERE scan_uuid = ?
      LIMIT 1
      `,
      [scanUuid]
    );

    if (existing.length) {
      results.push({
        scanUuid,
        ticketNumber,
        status: existing[0].scan_status,
        idempotent: true,
      });
      continue;
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [ticketRows] = await connection.execute<TicketRow[]>(
        `
        SELECT id, used
        FROM orders
        WHERE ticket_number = ?
          AND event_id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [ticketNumber, eventId]
      );

      let orderId: number | null = null;
      let status = "not_found";
      let conflictReason: string | null = "Ticket not found for selected event.";

      if (ticketRows.length) {
        orderId = ticketRows[0].id;

        if (Boolean(ticketRows[0].used)) {
          status = "already_used";
          conflictReason =
            "Ticket was already used before this offline scan synchronized.";
        } else {
          await connection.execute(
            `
            UPDATE orders
            SET
              used = 1,
              checked_in_at = ?,
              checked_in_by_user_id = ?,
              checked_in_device_id = ?
            WHERE id = ?
              AND used = 0
            `,
            [scannedAt, user.id, deviceId, orderId]
          );

          status = "accepted";
          conflictReason = null;
        }
      }

      await connection.execute(
        `
        INSERT INTO ticket_scan_events
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
        VALUES (?, ?, ?, ?, ?, ?, 'offline', ?, ?, ?, NOW())
        `,
        [
          scanUuid,
          eventId,
          orderId,
          ticketNumber,
          user.id,
          deviceId,
          status,
          conflictReason,
          scannedAt,
        ]
      );

      await connection.commit();

      results.push({
        scanUuid,
        ticketNumber,
        status,
        conflictReason,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  return NextResponse.json({
    success: true,
    results,
  });
}

function parseScanDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}
