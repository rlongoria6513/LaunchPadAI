import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const eventId = Number(body.eventId);
    const template = body.template;

    if (!eventId || !template) {
      return NextResponse.json(
        { error: "Missing event ID or template." },
        { status: 400 }
      );
    }

    await db.execute(
      `
      UPDATE events
      SET ticket_template = ?
      WHERE id = ?
      `,
      [JSON.stringify(template), eventId]
    );

    return NextResponse.json({
      success: true,
      message: "Ticket template saved.",
    });
  } catch (error) {
    console.error("Ticket template save error:", error);

    return NextResponse.json(
      { error: "Could not save ticket template." },
      { status: 500 }
    );
  }
}