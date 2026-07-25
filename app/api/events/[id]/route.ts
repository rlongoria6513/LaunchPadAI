import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.execute(
      "DELETE FROM events WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Event deleted."
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}