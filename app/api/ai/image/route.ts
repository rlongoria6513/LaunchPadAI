import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import {
  createAiImageGeneration,
  getAiImageHistory,
  markAiImageFailed,
  markAiImageQueued,
} from "@/app/lib/aiImage";
import {
  FAL_ENDPOINTS,
  submitFalImageStudio,
  uploadFalImage,
  type FalImageStudioSize,
} from "@/app/lib/aiProviders/fal";
import {
  getAiSettings,
  releaseAiUsage,
  reserveAiUsage,
} from "@/app/lib/aiTools";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

type SessionUser = { id?: unknown; role?: unknown };
type EventRow = RowDataPacket & { id: number; event_name: string };
type ImageMode = "text-to-image" | "edit-image";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VALID_MODES = new Set<ImageMode>(["text-to-image", "edit-image"]);
const VALID_SIZES = new Set<FalImageStudioSize>([
  "event-flyer",
  "square-social",
  "story",
  "banner",
]);

export async function GET() {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if(identity.role==="promoter") { const membership=await getMembershipStatus(identity.userId,identity.role); if(!membership.allowed)return NextResponse.json({error:membership.message,membershipUrl:"/promoter/membership"},{status:402}); }
  return NextResponse.json({ history: await getAiImageHistory(identity.userId) });
}

export async function POST(request: Request) {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if(identity.role==="promoter") { const membership=await getMembershipStatus(identity.userId,identity.role); if(!membership.allowed)return NextResponse.json({error:membership.message,membershipUrl:"/promoter/membership"},{status:402}); }
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: "LaunchPad AI is not connected. FAL_KEY is missing on the server." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "The image request could not be read." }, { status: 400 });
  }

  const eventId = Number(formData.get("eventId"));
  const mode = String(formData.get("mode") || "") as ImageMode;
  const size = String(formData.get("size") || "") as FalImageStudioSize;
  const prompt = String(formData.get("prompt") || "").trim().slice(0, 800);
  const uploadedImage = formData.get("image");

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Select an event first." }, { status: 400 });
  }
  if (!VALID_MODES.has(mode) || !VALID_SIZES.has(size)) {
    return NextResponse.json({ error: "Choose a valid image mode and size." }, { status: 400 });
  }
  if (prompt.length < 10) {
    return NextResponse.json(
      { error: "Enter a prompt or editing instruction with at least 10 characters." },
      { status: 400 }
    );
  }
  if (mode === "edit-image") {
    if (!(uploadedImage instanceof File) || uploadedImage.size <= 0) {
      return NextResponse.json({ error: "Upload an image to edit." }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(uploadedImage.type)) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP image." }, { status: 400 });
    }
    if (uploadedImage.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "The uploaded image must be 10 MB or smaller." }, { status: 400 });
    }
  }

  const [eventRows] = await db.execute<EventRow[]>(
    `
    SELECT id, event_name
    FROM events
    WHERE id = ? AND (? = 'admin' OR promoter_id = ?)
    LIMIT 1
    `,
    [eventId, identity.role, identity.userId]
  );
  const selectedEvent = eventRows[0];
  if (!selectedEvent) {
    return NextResponse.json(
      { error: "Event not found or you do not have access to it." },
      { status: 404 }
    );
  }

  const settings = await getAiSettings();
  const enabled =
    identity.role === "admin"
      ? settings.imageStudioAdminEnabled
      : settings.imageStudioPromoterEnabled;
  const limit =
    identity.role === "admin"
      ? settings.imageStudioAdminDailyLimit
      : settings.imageStudioPromoterDailyLimit;
  if (!enabled) {
    return NextResponse.json(
      { error: "AI Image Studio is disabled for your account type." },
      { status: 403 }
    );
  }

  const reservation = await reserveAiUsage({
    userId: identity.userId,
    role: identity.role,
    tool: "image-studio",
    limit,
  });
  if (!reservation.allowed) {
    return NextResponse.json(
      { error: `You have reached today's AI Image Studio limit of ${limit}.`, remaining: 0 },
      { status: 429 }
    );
  }

  let historyId = 0;
  try {
    const sourceImageUrl =
      mode === "edit-image" && uploadedImage instanceof File
        ? await uploadFalImage(uploadedImage)
        : "";
    const endpoint =
      mode === "edit-image" ? FAL_ENDPOINTS.imageEdit : FAL_ENDPOINTS.flyerImage;
    historyId = await createAiImageGeneration({
      userId: identity.userId,
      role: identity.role,
      eventId,
      eventName: selectedEvent.event_name,
      mode,
      imageSize: size,
      prompt,
      sourceImageUrl,
      endpoint,
    });
    const submission = await submitFalImageStudio({
      mode,
      prompt,
      size,
      sourceImageUrl,
    });
    await markAiImageQueued(historyId, submission.requestId);

    return NextResponse.json({
      id: historyId,
      status: "queued",
      remaining: reservation.remaining,
      limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image generation failed.";
    if (historyId) await markAiImageFailed(historyId, message).catch(() => undefined);
    await releaseAiUsage(identity.userId, "image-studio").catch(() => undefined);
    console.error("Qwen Image Studio submission failed:", error);
    return NextResponse.json(
      { error: "The image could not be submitted to fal.ai. Please try again." },
      { status: 502 }
    );
  }
}

async function getIdentity() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  const role = String(user?.role || "").toLowerCase();
  if (
    !session ||
    (role !== "admin" && role !== "promoter") ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return null;
  }
  return { userId, role };
}
