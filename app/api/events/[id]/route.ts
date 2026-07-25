import { NextResponse } from "next/server";
import db from "../../lib/db";

// GET ALL EVENTS
export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT * FROM events ORDER BY event_date ASC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to load events." },
      { status: 500 }
    );
  }
}

// CREATE EVENT
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      eventName,
      venue,
      eventDate,
      eventTime,
      ticketPrice,
    } = body;

    await db.execute(
      `INSERT INTO events
      (event_name, venue, event_date, event_time, ticket_price)
      VALUES (?, ?, ?, ?, ?)`,
      [
        eventName,
        venue,
        eventDate,
        eventTime,
        ticketPrice,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Event saved successfully!",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Database Error",
      },
      {
        status: 500,
      }
    );
  }
}