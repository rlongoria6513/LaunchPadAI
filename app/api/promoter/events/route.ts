import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import mysql from "mysql2/promise";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const sessionUser = session.user as SessionUser;

  if (sessionUser?.role !== "promoter") {
    return NextResponse.json(
      { error: "Only promoters can create events." },
      { status: 403 }
    );
  }
  const membership=await getMembershipStatus(Number(sessionUser.id),"promoter");
  if(!membership.allowed)return NextResponse.json({error:membership.message,membershipUrl:"/promoter/membership"},{status:402});

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
      ticket_price,
      promoter_id
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      event_name,
      venue,
      event_date,
      event_time,
      ticket_price,
      Number(sessionUser?.id),
    ]
  );

  await connection.end();

  return NextResponse.json({ success: true });
}
