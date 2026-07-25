import { NextResponse } from "next/server";
import { auth } from "../../auth";
import mysql from "mysql2/promise";

export async function POST() {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await connection.execute(
    `
      INSERT INTO promoter_requests (user_id, status)
      VALUES (?, 'pending')
    `,
    [(session.user as any).id]
  );

  await connection.end();

  return NextResponse.json({
    message: "Promoter request submitted.",
  });
}