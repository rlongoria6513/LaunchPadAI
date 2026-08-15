import { auth } from "@/app/auth";
import {
  getAiImageGeneration,
  markAiImageCompleted,
  markAiImageFailed,
  markAiImageProgress,
  toAiImageHistoryItem,
} from "@/app/lib/aiImage";
import { getFalImageStudioStatus } from "@/app/lib/aiProviders/fal";
import { releaseAiUsage } from "@/app/lib/aiTools";
import { NextResponse } from "next/server";

type SessionUser = { id?: unknown; role?: unknown };

export async function GET(
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
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid image request." }, { status: 400 });
  }

  let generation = await getAiImageGeneration(id, userId);
  if (!generation) return NextResponse.json({ error: "Image request not found." }, { status: 404 });
  if (["completed", "failed"].includes(generation.status) || !generation.fal_request_id) {
    return NextResponse.json({ item: toAiImageHistoryItem(generation) });
  }

  try {
    const falStatus = await getFalImageStudioStatus({
      requestId: generation.fal_request_id,
      endpoint: generation.fal_endpoint,
    });
    if (falStatus.status === "completed") {
      await markAiImageCompleted(id, falStatus.imageUrl);
    } else {
      await markAiImageProgress(id, falStatus.status);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "fal.ai could not finish the image.";
    await markAiImageFailed(id, message);
    await releaseAiUsage(userId, "image-studio").catch(() => undefined);
    console.error("Qwen Image Studio status failed:", error);
  }

  generation = await getAiImageGeneration(id, userId);
  return NextResponse.json({ item: generation ? toAiImageHistoryItem(generation) : null });
}
