import { auth } from "@/app/auth";
import { releaseAiUsage } from "@/app/lib/aiTools";
import {
  getAiVideoGeneration,
  markAiVideoCompleted,
  markAiVideoFailed,
  markAiVideoProgress,
  toHistoryItem,
} from "@/app/lib/aiVideo";
import { getFalPikaPromotionalVideoStatus } from "@/app/lib/aiProviders/fal";
import { NextResponse } from "next/server";

type SessionUser = { id?: unknown; role?: unknown };

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  if (
    !session ||
    String(user?.role || "").toLowerCase() !== "admin" ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid video request." }, { status: 400 });
  }

  let generation = await getAiVideoGeneration(id, userId);
  if (!generation) {
    return NextResponse.json({ error: "Video request not found." }, { status: 404 });
  }

  if (["completed", "failed"].includes(generation.status)) {
    return NextResponse.json({ item: toHistoryItem(generation) });
  }
  if (!generation.fal_request_id) {
    return NextResponse.json({ item: toHistoryItem(generation) });
  }

  try {
    const falStatus = await getFalPikaPromotionalVideoStatus(
      generation.fal_request_id
    );
    if (falStatus.status === "completed") {
      await markAiVideoCompleted(id, falStatus.videoUrl);
    } else {
      await markAiVideoProgress(id, falStatus.status);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "fal.ai could not finish the video.";
    await markAiVideoFailed(id, message);
    await releaseAiUsage(userId, "promotional-video").catch(() => undefined);
    console.error("Pika promotional video status failed:", error);
  }

  generation = await getAiVideoGeneration(id, userId);
  return NextResponse.json({ item: generation ? toHistoryItem(generation) : null });
}
