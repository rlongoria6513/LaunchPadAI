import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import mysql from "mysql2/promise";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if ((session.user as any)?.role !== "promoter") {
    return NextResponse.json(
      { error: "Only promoters can create events." },
      { status: 403 }
    );
  }

  const {
    event_name,
    venue,
    event_date,
    event_time,
    ticket_price,
  } = await request.json();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await connection.execute(
    `
    INSERT INTO events
    (
      event_name,
      venue,
      event_date,
      event_time,
      ticket_price
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      event_name,
      venue,
      event_date,
      event_time,
      ticket_price,
    ]
  );

  await connection.end();

  return NextResponse.json({ success: true });
}