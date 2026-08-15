import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import {
  getAiImageGeneration,
  markAiImageUsedAsFlyer,
} from "@/app/lib/aiImage";
import type { ResultSetHeader } from "mysql2";
import { NextResponse } from "next/server";

type SessionUser = { id?: unknown; role?: unknown };

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  const role = String(user?.role || "").toLowerCase();
  if (!session || !["admin", "promoter"].includes(role) || userId <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  const generation = await getAiImageGeneration(id, userId);
  if (!generation || generation.status !== "completed" || !generation.result_image_url) {
    return NextResponse.json({ error: "A completed image is required." }, { status: 400 });
  }

  const [result] = await db.execute<ResultSetHeader>(
    `
    UPDATE events
    SET image_url = ?
    WHERE id = ? AND (? = 'admin' OR promoter_id = ?)
    LIMIT 1
    `,
    [generation.result_image_url, generation.event_id, role, userId]
  );
  if (result.affectedRows !== 1) {
    return NextResponse.json(
      { error: "Event not found or you do not have permission to update it." },
      { status: 403 }
    );
  }

  await markAiImageUsedAsFlyer(id);
  return NextResponse.json({ success: true, message: "Event flyer updated." });
}
