import db from "@/app/lib/db";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type SessionUserWithRole = {
  role?: unknown;
};

type TicketRow = RowDataPacket & {
  used: number;
};

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = String(
      (session.user as SessionUserWithRole | undefined)?.role || ""
    ).toLowerCase();

    if (role !== "promoter" && role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { ticketNumber } = await req.json();

    const [rows] = await db.execute<TicketRow[]>(
      `
      SELECT *
FROM orders
WHERE ticket_number = ?
LIMIT 1
      `,
      [ticketNumber]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        valid: false,
        message: "Ticket not found.",
      });
    }

    if (rows[0].used === 1) {
      return NextResponse.json({
        valid: false,
        message: "Ticket already used.",
      });
    }

    await db.execute(
      `
      UPDATE orders
SET used = 1
WHERE ticket_number = ?
      `,
      [ticketNumber]
    );

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
