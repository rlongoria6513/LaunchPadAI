import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type UserRow = RowDataPacket & {
  id: number;
  role: string | null;
};

export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  const currentUser = session?.user as
    | {
        id?: unknown;
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

  const currentUserId = Number(currentUser?.id || 0);

  if (targetUserId === currentUserId) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account." },
      { status: 403 }
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
        { error: "Admin accounts cannot be deleted." },
        { status: 403 }
      );
    }

    if (targetRole !== "customer" && targetRole !== "promoter") {
      return NextResponse.json(
        { error: "Only customer and promoter accounts can be deleted." },
        { status: 403 }
      );
    }

    const [result] = await db.execute<ResultSetHeader>(
      `
      DELETE FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [targetUserId]
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json(
        { error: "User could not be deleted." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted",
    });
  } catch (error: unknown) {
    console.error("Delete user error:", error);

    return NextResponse.json(
      {
        error:
          "Could not delete this user account. No orders, tickets, payments, or event records were changed.",
      },
      { status: 500 }
    );
  }
}
