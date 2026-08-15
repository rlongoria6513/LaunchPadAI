import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import {
  getAiSettings,
  releaseAiUsage,
  reserveAiUsage,
} from "@/app/lib/aiTools";
import {
  createAiVideoGeneration,
  getAiVideoHistory,
  markAiVideoFailed,
  markAiVideoQueued,
} from "@/app/lib/aiVideo";
import {
  submitFalPikaPromotionalVideo,
  uploadFalImage,
} from "@/app/lib/aiProviders/fal";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

type SessionUser = { id?: unknown; role?: unknown };
type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  image_url: string | null;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ history: await getAiVideoHistory(identity.userId) });
}

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: "FAL_KEY is not configured on the server." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "The video request could not be read." },
      { status: 400 }
    );
  }

  const eventId = Number(formData.get("eventId"));
  const motionPrompt = String(formData.get("motionPrompt") || "")
    .trim()
    .slice(0, 1000);
  const uploadedImage = formData.get("image");

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Select an event first." }, { status: 400 });
  }
  if (motionPrompt.length < 10) {
    return NextResponse.json(
      { error: "Enter a motion prompt with at least 10 characters." },
      { status: 400 }
    );
  }

  const [eventRows] = await db.execute<EventRow[]>(
    `SELECT id, event_name, image_url FROM events WHERE id = ? LIMIT 1`,
    [eventId]
  );
  const selectedEvent = eventRows[0];
  if (!selectedEvent) {
    return NextResponse.json({ error: "That event was not found." }, { status: 404 });
  }

  const settings = await getAiSettings();
  if (!settings.promotionalVideoEnabled) {
    return NextResponse.json(
      { error: "Promotional video generation is disabled in AI settings." },
      { status: 403 }
    );
  }

  const reservation = await reserveAiUsage({
    userId: identity.userId,
    role: "admin",
    tool: "promotional-video",
    limit: settings.promotionalVideoDailyLimit,
  });
  if (!reservation.allowed) {
    return NextResponse.json(
      {
        error: `You have reached today's limit of ${settings.promotionalVideoDailyLimit} promotional videos.`,
        remaining: 0,
      },
      { status: 429 }
    );
  }

  let historyId = 0;
  try {
    let sourceImageUrl = String(selectedEvent.image_url || "").trim();

    if (uploadedImage instanceof File && uploadedImage.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.has(uploadedImage.type)) {
        throw new VideoInputError("Upload a JPG, PNG, WebP, GIF, or AVIF image.");
      }
      if (uploadedImage.size > MAX_IMAGE_BYTES) {
        throw new VideoInputError("The uploaded image must be 10 MB or smaller.");
      }
      sourceImageUrl = await uploadFalImage(uploadedImage);
    }

    if (!sourceImageUrl) {
      throw new VideoInputError(
        "This event has no flyer. Upload an image before generating the video."
      );
    }

    historyId = await createAiVideoGeneration({
      userId: identity.userId,
      eventId,
      eventName: selectedEvent.event_name,
      sourceImageUrl,
      motionPrompt,
    });
    const requestId = await submitFalPikaPromotionalVideo({
      imageUrl: sourceImageUrl,
      prompt: motionPrompt,
    });
    await markAiVideoQueued(historyId, requestId);

    return NextResponse.json({
      id: historyId,
      status: "queued",
      remaining: reservation.remaining,
      limit: settings.promotionalVideoDailyLimit,
    });
  } catch (error) {
    if (historyId) {
      await markAiVideoFailed(historyId, userError(error)).catch(() => undefined);
    }
    await releaseAiUsage(identity.userId, "promotional-video").catch(() => undefined);
    console.error("Pika promotional video submission failed:", error);
    const isInputError = error instanceof VideoInputError;
    return NextResponse.json(
      {
        error: isInputError
          ? error.message
          : "The video could not be submitted to fal.ai. Please try again.",
      },
      { status: isInputError ? 400 : 502 }
    );
  }
}

async function getAdminIdentity() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  if (
    !session ||
    String(user?.role || "").toLowerCase() !== "admin" ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return null;
  }
  return { userId };
}

function userError(error: unknown) {
  return error instanceof Error ? error.message : "Video generation failed.";
}

class VideoInputError extends Error {}
