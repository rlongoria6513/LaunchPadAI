import db from "@/app/lib/db";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const role = String(
      (session?.user as { role?: unknown } | undefined)?.role || ""
    ).toLowerCase();
    const userId = Number(
      (session?.user as { id?: unknown } | undefined)?.id || 0
    );

    if (!session || (role !== "promoter" && role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const membership = await getMembershipStatus(userId, role);
    if (!membership.allowed) return NextResponse.json({ success:false, error:membership.message, membershipUrl:"/promoter/membership" }, { status:402 });

    const {
      eventName,
      venue,
      eventDate,
      eventTime,
      ticketPrice,
      imageUrl,
    } = await req.json();

    const [result] = await db.execute<ResultSetHeader>(
      `
      INSERT INTO events
      (
        event_name,
        venue,
        event_date,
        event_time,
        ticket_price,
        image_url,
        promoter_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        eventName,
        venue,
        eventDate,
        eventTime,
        ticketPrice,
        imageUrl,
        role === "promoter" ? userId : null,
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Event created successfully!",
    });
  } catch (err) {
    console.error("CREATE EVENT ERROR");
    console.error(err);
    const message = err instanceof Error ? err.message : "Server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const [rows] = await db.execute(`
      SELECT *
      FROM events
      ORDER BY event_date ASC
    `);

    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
