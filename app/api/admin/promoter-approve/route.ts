import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import mysql from "mysql2/promise";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await request.json();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Get the user associated with the promoter request
  const [rows]: any = await connection.execute(
    `SELECT user_id FROM promoter_requests WHERE id = ?`,
    [requestId]
  );

  if (rows.length === 0) {
    await connection.end();
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const userId = rows[0].user_id;

  // Update the user's role
  await connection.execute(
    `UPDATE users SET role = 'promoter' WHERE id = ?`,
    [userId]
  );

  // Mark the request as approved
  await connection.execute(
    `UPDATE promoter_requests SET status = 'approved' WHERE id = ?`,
    [requestId]
  );

  await connection.end();

  return NextResponse.json({ success: true });
}