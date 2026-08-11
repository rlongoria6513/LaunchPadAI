import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
};

export async function PUT(request: Request) {
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

  let name = "";
  let phone = "";

  try {
    const body = await request.json();
    name = typeof body?.name === "string" ? body.name.trim() : "";
    phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  } catch {
    name = "";
    phone = "";
  }

  if (!name) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: "Name must be 100 characters or fewer." },
      { status: 400 }
    );
  }

  if (phone.length > 50) {
    return NextResponse.json(
      { error: "Phone must be 50 characters or fewer." },
      { status: 400 }
    );
  }

  try {
    const [result] = await db.execute<ResultSetHeader>(
      `
      UPDATE users
      SET name = ?, phone = ?
      WHERE id = ? AND role = 'customer'
      LIMIT 1
      `,
      [name, phone || null, userId]
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "Profile could not be updated." },
        { status: 404 }
      );
    }

    const [rows] = await db.execute<UserRow[]>(
      `
      SELECT id, name, email, phone, role
      FROM users
      WHERE id = ? AND role = 'customer'
      LIMIT 1
      `,
      [userId]
    );

    return NextResponse.json({
      success: true,
      profile: {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        phone: rows[0].phone || "",
      },
    });
  } catch (error: unknown) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      { error: "Could not update profile." },
      { status: 500 }
    );
  }
}
