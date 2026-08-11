import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

type UserRow = RowDataPacket & {
  id: number;
  password: string;
  role: string | null;
};

export async function POST(request: Request) {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const role = String(sessionUser?.role || "").toLowerCase();
  const userId = Number(sessionUser?.id || 0);

  if (
    !session ||
    role !== "customer" ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let currentPassword = "";
  let newPassword = "";

  try {
    const body = await request.json();
    currentPassword =
      typeof body?.currentPassword === "string"
        ? body.currentPassword
        : "";
    newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";
  } catch {
    currentPassword = "";
    newPassword = "";
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (newPassword.length > 128) {
    return NextResponse.json(
      { error: "New password must be 128 characters or fewer." },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.execute<UserRow[]>(
      `
      SELECT id, password, role
      FROM users
      WHERE id = ? AND role = 'customer'
      LIMIT 1
      `,
      [userId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const storedPassword = String(rows[0].password || "");
    const passwordMatches =
      isBcryptHash(storedPassword)
        ? await bcrypt.compare(currentPassword, storedPassword)
        : currentPassword === storedPassword;

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [result] = await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET password = ?
      WHERE id = ? AND role = 'customer'
      LIMIT 1
      `,
      [hashedPassword, userId]
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Password could not be changed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed.",
    });
  } catch (error: unknown) {
    console.error("Password change error:", error);

    return NextResponse.json(
      { error: "Could not change password." },
      { status: 500 }
    );
  }
}

function isBcryptHash(value: string) {
  return (
    value.startsWith("$2a$") ||
    value.startsWith("$2b$") ||
    value.startsWith("$2y$")
  );
}
