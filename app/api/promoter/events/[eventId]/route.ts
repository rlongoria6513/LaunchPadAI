import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const role = String(sessionUser?.role || "").toLowerCase();
  const userId = Number(sessionUser?.id || 0);

  if (!session || (role !== "promoter" && role !== "admin")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { eventId } = await context.params;
  const targetEventId = Number(eventId);

  if (!Number.isInteger(targetEventId) || targetEventId <= 0) {
    return NextResponse.json(
      { error: "Invalid event ID" },
      { status: 400 }
    );
  }

  const {
    event_name,
    venue,
    event_date,
    event_time,
    ticket_price,
  } = await request.json();

  const normalizedName = String(event_name || "").trim();
  const normalizedVenue = String(venue || "").trim();
  const normalizedDate = String(event_date || "").trim();
  const normalizedTime = String(event_time || "").trim();
  const normalizedPrice = Number(ticket_price);

  if (
    !normalizedName ||
    !normalizedVenue ||
    !normalizedDate ||
    !normalizedTime ||
    !Number.isFinite(normalizedPrice) ||
    normalizedPrice < 0
  ) {
    return NextResponse.json(
      { error: "Please complete all event fields." },
      { status: 400 }
    );
  }

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `
      UPDATE events
      SET
        event_name = ?,
        venue = ?,
        event_date = ?,
        event_time = ?,
        ticket_price = ?
      WHERE id = ?
        AND (? = 'admin' OR promoter_id = ?)
      LIMIT 1
      `,
      [
        normalizedName,
        normalizedVenue,
        normalizedDate,
        normalizedTime,
        normalizedPrice,
        targetEventId,
        role,
        userId,
      ]
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event updated.",
    });
  } catch (error) {
    console.error("Update promoter event error:", error);

    return NextResponse.json(
      { error: "Could not update this event." },
      { status: 500 }
    );
  }
}
