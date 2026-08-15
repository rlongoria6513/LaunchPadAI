import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { isDurableVideoStorageConfigured, uploadDurableAsset } from "@/app/lib/cloudinaryStorage";
import {
  VIDEO_PLACEMENTS, getVideoPlacements, removeVideoPlacement,
  saveVideoPlacement, setVideoPlacementVisibility, type VideoPlacementName,
} from "@/app/lib/videoPlacements";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

type SessionUser = { id?: unknown; role?: unknown };
type VideoRow = RowDataPacket & { id: number; event_id: number; video_url: string | null; status: string };
const MAX_FALLBACK_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ placements: await getVideoPlacements(), storageConfigured: isDurableVideoStorageConfigured() });
}

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDurableVideoStorageConfigured()) {
    return NextResponse.json({ error: "Publishing is disabled until CLOUDINARY_URL is configured in Render." }, { status: 503 });
  }

  try {
    const data = await request.formData();
    const placement = String(data.get("placement") || "") as VideoPlacementName;
    const generationId = positiveInteger(data.get("generationId"));
    const eventId = positiveInteger(data.get("eventId"));
    if (!VIDEO_PLACEMENTS.includes(placement)) throw new InputError("Select a valid placement.");
    if (!generationId) throw new InputError("Select a completed Pika video.");
    if (placement === "event-page" && !eventId) throw new InputError("Select an event for the event-page placement.");

    const [videoRows] = await db.execute<VideoRow[]>(
      `SELECT id, event_id, video_url, status FROM ai_video_generations WHERE id = ? LIMIT 1`, [generationId]
    );
    const video = videoRows[0];
    if (!video || video.status !== "completed" || !video.video_url) throw new InputError("That Pika video is not complete.");
    if (eventId) {
      const [events] = await db.execute<RowDataPacket[]>(`SELECT id FROM events WHERE id = ? LIMIT 1`, [eventId]);
      if (!events.length) throw new InputError("That event was not found.");
    }

    const durableVideo = await uploadDurableAsset({
      file: video.video_url, resourceType: "video", publicId: `launchpad/video-placements/pika-${generationId}`,
    });
    let fallbackUrl = String(data.get("existingFallbackUrl") || "").trim();
    let fallbackPublicId = "";
    const fallback = data.get("fallbackImage");
    if (fallback instanceof File && fallback.size > 0) {
      if (!IMAGE_TYPES.has(fallback.type)) throw new InputError("Fallback image must be JPG, PNG, or WebP.");
      if (fallback.size > MAX_FALLBACK_BYTES) throw new InputError("Fallback image must be 10 MB or smaller.");
      const stored = await uploadDurableAsset({
        file: fallback, resourceType: "image", publicId: `launchpad/video-placements/fallback-${placement}-${eventId || "global"}`,
      });
      fallbackUrl = stored.url;
      fallbackPublicId = stored.publicId;
    }

    const startsAt = optionalDate(data.get("startsAt"));
    const endsAt = optionalDate(data.get("endsAt"));
    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) throw new InputError("End date must be after start date.");
    const autoplay = data.get("autoplay") === "true";
    await saveVideoPlacement({
      placement, eventId: placement === "event-page" ? eventId : null, generationId,
      videoUrl: durableVideo.url, videoPublicId: durableVideo.publicId,
      mobileFallbackUrl: fallbackUrl, mobileFallbackPublicId: fallbackPublicId,
      headline: text(data.get("headline"), 180), supportingText: text(data.get("supportingText"), 500),
      buttonLabel: text(data.get("buttonLabel"), 80), buttonLink: safeLink(data.get("buttonLink")),
      visible: data.get("visible") === "true", startsAt, endsAt, autoplay,
      muted: placement === "homepage-hero" && autoplay ? true : data.get("muted") === "true",
      loop: data.get("loop") === "true", updatedBy: identity.userId,
    });
    return NextResponse.json({ success: true, placements: await getVideoPlacements() });
  } catch (error) {
    console.error("Video placement publish failed:", error);
    const input = error instanceof InputError;
    return NextResponse.json({ error: input ? error.message : "The video could not be published to durable storage." }, { status: input ? 400 : 502 });
  }
}

export async function PATCH(request: Request) {
  if (!(await getAdminIdentity())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = positiveInteger(body.id);
  if (!id) return NextResponse.json({ error: "Invalid placement." }, { status: 400 });
  await setVideoPlacementVisibility(id, Boolean(body.visible));
  return NextResponse.json({ success: true, placements: await getVideoPlacements() });
}

export async function DELETE(request: Request) {
  if (!(await getAdminIdentity())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = positiveInteger(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Invalid placement." }, { status: 400 });
  await removeVideoPlacement(id);
  return NextResponse.json({ success: true, placements: await getVideoPlacements() });
}

async function getAdminIdentity() {
  const session = await auth(); const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  return session && String(user?.role || "").toLowerCase() === "admin" && Number.isInteger(userId) && userId > 0 ? { userId } : null;
}
function positiveInteger(value: unknown) { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; }
function text(value: unknown, max: number) { return String(value || "").trim().slice(0, max); }
function optionalDate(value: unknown) { const v = String(value || "").trim(); if (!v) return null; const d = new Date(v); if (Number.isNaN(d.valueOf())) throw new InputError("Enter valid start and end dates."); return d.toISOString().slice(0, 19).replace("T", " "); }
function safeLink(value: unknown) { const v = text(value, 500); if (!v) return ""; if (v.startsWith("/")) return v; try { const u = new URL(v); if (u.protocol === "http:" || u.protocol === "https:") return v; } catch {} throw new InputError("Button link must be a site path or an http(s) URL."); }
class InputError extends Error {}
