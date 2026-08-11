import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  id: number;
  role: string | null;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  const currentUser = session?.user as
    | {
        role?: unknown;
      }
    | undefined;

  if (!session || String(currentUser?.role || "").toLowerCase() !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { userId } = await context.params;
  const targetUserId = Number(userId);

  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return NextResponse.json(
      { error: "Invalid user ID" },
      { status: 400 }
    );
  }

  let password = "";

  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    password = "";
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Temporary password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (password.length > 128) {
    return NextResponse.json(
      { error: "Temporary password must be 128 characters or fewer." },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.execute<UserRow[]>(
      `
      SELECT id, role
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [targetUserId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const targetRole = String(rows[0].role || "").toLowerCase();

    if (targetRole === "admin") {
      return NextResponse.json(
        { error: "Admin passwords cannot be changed from this control." },
        { status: 403 }
      );
    }

    if (targetRole !== "customer" && targetRole !== "promoter") {
      return NextResponse.json(
        { error: "Only customer and promoter passwords can be reset." },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET password = ?
      WHERE id = ?
      LIMIT 1
      `,
      [hashedPassword, targetUserId]
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Password could not be reset." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Temporary password saved.",
    });
  } catch (error: unknown) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      { error: "Could not reset this password." },
      { status: 500 }
    );
  }
}
