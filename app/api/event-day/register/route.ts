import {
  accessibleEventsWhere,
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type SummaryRow = RowDataPacket & {
  event_id: number;
  event_name: string;
  ticket_records: number | string | null;
  tickets_sold: number | string | null;
  ticket_revenue: number | string | null;
  cash_total: number | string | null;
  card_total: number | string | null;
  stripe_total: number | string | null;
  merch_total: number | string | null;
  revenue_total: number | string | null;
  checked_in: number | string | null;
};

type TransactionRow = RowDataPacket & {
  id: number;
  source: string;
  event_id: number;
  event_name: string;
  label: string;
  customer: string | null;
  payment_method: string | null;
  total_amount: number | string | null;
  created_at: string | Date | null;
};

export async function GET(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = Number(searchParams.get("eventId") || 0);

  if (eventId > 0 && !(await canAccessEvent(user, eventId, "scan"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where = accessibleEventsWhere(user);
  const eventFilter = eventId > 0 ? "AND e.id = ?" : "";
  const params = [...where.params, ...(eventId > 0 ? [eventId] : [])];

  const [summaryRows] = await db.execute<SummaryRow[]>(
    `
    SELECT
      e.id AS event_id,
      e.event_name,
      COUNT(o.id) AS ticket_records,
      COALESCE(SUM(COALESCE(o.quantity, 1)), 0) AS tickets_sold,
      COALESCE(SUM(o.amount_paid), 0) AS ticket_revenue,
      COALESCE(SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_charged ELSE 0 END), 0) AS cash_total,
      COALESCE(SUM(CASE WHEN o.payment_method = 'card' THEN o.total_charged ELSE 0 END), 0) AS card_total,
      COALESCE(SUM(CASE WHEN o.stripe_session_id IS NOT NULL THEN o.total_charged ELSE 0 END), 0) AS stripe_total,
      COALESCE((
        SELECT SUM(ms.total_amount)
        FROM event_merchandise_sales ms
        WHERE ms.event_id = e.id
          AND LOWER(ms.payment_status) = 'paid'
      ), 0) AS merch_total,
      COALESCE(SUM(o.total_charged), 0) + COALESCE((
        SELECT SUM(ms.total_amount)
        FROM event_merchandise_sales ms
        WHERE ms.event_id = e.id
          AND LOWER(ms.payment_status) = 'paid'
      ), 0) AS revenue_total,
      COALESCE(SUM(CASE WHEN o.used = 1 THEN 1 ELSE 0 END), 0) AS checked_in
    FROM events e
    LEFT JOIN orders o
      ON o.event_id = e.id
      AND LOWER(o.payment_status) = 'paid'
    WHERE ${where.sql}
      ${eventFilter}
    GROUP BY e.id, e.event_name
    ORDER BY e.event_name ASC
    `,
    params
  );

  const [transactionRows] = await db.execute<TransactionRow[]>(
    `
    SELECT *
    FROM (
      SELECT
        o.id,
        'ticket' AS source,
        o.event_id,
        o.event_name,
        COALESCE(o.ticket_type, 'legacy') AS label,
        COALESCE(o.customer_name, o.customer_email) AS customer,
        COALESCE(o.payment_method, CASE WHEN o.stripe_session_id IS NOT NULL THEN 'stripe' ELSE NULL END) AS payment_method,
        o.total_charged AS total_amount,
        o.created_at
      FROM orders o
      INNER JOIN events e
        ON o.event_id = e.id
      WHERE ${where.sql}
        ${eventFilter}
        AND LOWER(o.payment_status) = 'paid'

      UNION ALL

      SELECT
        ms.id,
        'merchandise' AS source,
        ms.event_id,
        e.event_name,
        ms.item_name AS label,
        NULL AS customer,
        ms.payment_method,
        ms.total_amount,
        ms.created_at
      FROM event_merchandise_sales ms
      INNER JOIN events e
        ON ms.event_id = e.id
      WHERE ${where.sql}
        ${eventFilter}
        AND LOWER(ms.payment_status) = 'paid'
    ) activity
    ORDER BY created_at DESC
    LIMIT 60
    `,
    [...params, ...params]
  );

  return NextResponse.json({
    summary: summaryRows.map((row) => ({
      eventId: row.event_id,
      eventName: row.event_name,
      ticketRecords: Number(row.ticket_records || 0),
      ticketsSold: Number(row.tickets_sold || 0),
      ticketRevenue: Number(row.ticket_revenue || 0),
      cashTotal: Number(row.cash_total || 0),
      cardTotal: Number(row.card_total || 0),
      stripeTotal: Number(row.stripe_total || 0),
      merchandiseTotal: Number(row.merch_total || 0),
      revenueTotal: Number(row.revenue_total || 0),
      checkedIn: Number(row.checked_in || 0),
    })),
    transactions: transactionRows.map((row) => ({
      id: row.id,
      source: row.source,
      eventId: row.event_id,
      eventName: row.event_name,
      label: row.label,
      customer: row.customer,
      paymentMethod: row.payment_method,
      totalAmount: Number(row.total_amount || 0),
      createdAt: row.created_at,
    })),
  });
}
