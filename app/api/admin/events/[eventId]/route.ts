import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { auth } from "@/app/auth";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();

  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await context.params;
  const id = Number(eventId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.execute("DELETE FROM events WHERE id = ?", [id]);

    return NextResponse.json({ success: true });
  } finally {
    await connection.end();
  }
}