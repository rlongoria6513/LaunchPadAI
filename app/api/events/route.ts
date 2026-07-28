import db from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      eventName,
      venue,
      eventDate,
      eventTime,
      ticketPrice,
      imageUrl,
    } = await req.json();

    const [result]: any = await db.execute(
      `
      INSERT INTO events
      (
        event_name,
        venue,
        event_date,
        event_time,
        ticket_price,
        image_url
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        eventName,
        venue,
        eventDate,
        eventTime,
        ticketPrice,
        imageUrl,
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Event created successfully!",
    });
  } catch (err: any) {
    console.error("CREATE EVENT ERROR");
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
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
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}