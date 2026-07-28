import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticketId" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.execute(
      `
      SELECT
        orders.*,
        events.image_url
      FROM orders
      LEFT JOIN events
        ON orders.event_id = events.id
      WHERE orders.id = ?
      `,
      [ticketId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: rows[0],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}