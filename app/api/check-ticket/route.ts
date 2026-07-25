import db from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { ticketNumber } = await req.json();

    const [rows]: any = await db.execute(
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
  } catch (err: any) {
    return NextResponse.json(
      {
        valid: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}