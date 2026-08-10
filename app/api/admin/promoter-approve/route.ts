import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import db from "@/app/lib/db";

export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { requestId, email } = await request.json();

  if (!requestId || !email) {
    return NextResponse.json(
      { error: "Missing request information" },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  const [requestRows]: any = await db.execute(
    `
    SELECT id, status, email
    FROM promoter_requests
    WHERE id = ?
    LIMIT 1
    `,
    [requestId]
  );

  if (!requestRows.length) {
    return NextResponse.json(
      { error: "Promoter request not found" },
      { status: 404 }
    );
  }

  const [userRows]: any = await db.execute(
    `
    SELECT id, role
    FROM users
    WHERE LOWER(email) = ?
    LIMIT 1
    `,
    [normalizedEmail]
  );

  if (!userRows.length) {
    return NextResponse.json(
      {
        error:
          "No LaunchPad customer account was found with this email. The applicant must create an account before approval.",
      },
      { status: 404 }
    );
  }

  const userId = userRows[0].id;

  await db.execute(
    `
    UPDATE users
    SET role = 'promoter'
    WHERE id = ?
    `,
    [userId]
  );

  await db.execute(
    `
    UPDATE promoter_requests
    SET status = 'approved'
    WHERE id = ?
    `,
    [requestId]
  );

  return NextResponse.json({
    success: true,
    message: "Promoter approved",
  });
}