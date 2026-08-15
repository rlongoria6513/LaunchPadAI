import db from "@/app/lib/db";
import { ensureAiToolsSchema } from "@/app/lib/aiTools";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const VIDEO_PLACEMENTS = [
  "homepage-hero",
  "become-promoter",
  "featured-events",
  "event-page",
] as const;
export type VideoPlacementName = (typeof VIDEO_PLACEMENTS)[number];

export type VideoPlacement = {
  id: number;
  placement: VideoPlacementName;
  eventId: number | null;
  eventName: string;
  generationId: number;
  videoUrl: string;
  mobileFallbackUrl: string;
  headline: string;
  supportingText: string;
  buttonLabel: string;
  buttonLink: string;
  visible: boolean;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  updatedAt: string | Date;
};

type PlacementRow = RowDataPacket & {
  id: number; placement: VideoPlacementName; event_id: number | null;
  event_name: string | null; generation_id: number; video_url: string;
  mobile_fallback_url: string | null; headline: string | null;
  supporting_text: string | null; button_label: string | null;
  button_link: string | null; visible: number; starts_at: string | Date | null;
  ends_at: string | Date | null; autoplay: number; muted: number; loop_video: number;
  updated_at: string | Date;
};

let placementSchemaPromise: Promise<void> | null = null;
export function ensureVideoPlacementSchema() {
  if (!placementSchemaPromise) {
    placementSchemaPromise = createSchema().catch((error) => {
      placementSchemaPromise = null;
      throw error;
    });
  }
  return placementSchemaPromise;
}

async function createSchema() {
  await ensureAiToolsSchema();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS video_placements (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      placement_key VARCHAR(80) NOT NULL,
      placement VARCHAR(32) NOT NULL,
      event_id INT NULL,
      generation_id BIGINT UNSIGNED NOT NULL,
      video_url TEXT NOT NULL,
      video_public_id VARCHAR(255) NOT NULL,
      mobile_fallback_url TEXT NULL,
      mobile_fallback_public_id VARCHAR(255) NULL,
      headline VARCHAR(180) NULL,
      supporting_text VARCHAR(500) NULL,
      button_label VARCHAR(80) NULL,
      button_link VARCHAR(500) NULL,
      visible TINYINT(1) NOT NULL DEFAULT 1,
      starts_at DATETIME NULL,
      ends_at DATETIME NULL,
      autoplay TINYINT(1) NOT NULL DEFAULT 1,
      muted TINYINT(1) NOT NULL DEFAULT 1,
      loop_video TINYINT(1) NOT NULL DEFAULT 1,
      updated_by INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY video_placement_key (placement_key),
      KEY video_placement_event (event_id),
      KEY video_placement_dates (visible, starts_at, ends_at)
    )
  `);
}

const selectSql = `
  SELECT vp.*, COALESCE(e.event_name, '') AS event_name
  FROM video_placements vp LEFT JOIN events e ON e.id = vp.event_id
`;

export async function getVideoPlacements() {
  await ensureVideoPlacementSchema();
  const [rows] = await db.execute<PlacementRow[]>(`${selectSql} ORDER BY vp.updated_at DESC`);
  return rows.map(mapPlacement);
}

export async function getActiveVideoPlacement(placement: VideoPlacementName, eventId?: number) {
  await ensureVideoPlacementSchema();
  const key = placement === "event-page" ? `event-page:${eventId || 0}` : placement;
  const [rows] = await db.execute<PlacementRow[]>(`
    ${selectSql}
    WHERE vp.placement_key = ? AND vp.visible = 1
      AND (vp.starts_at IS NULL OR vp.starts_at <= UTC_TIMESTAMP())
      AND (vp.ends_at IS NULL OR vp.ends_at >= UTC_TIMESTAMP())
    LIMIT 1
  `, [key]);
  return rows[0] ? mapPlacement(rows[0]) : null;
}

export async function saveVideoPlacement(input: Omit<VideoPlacement, "id" | "eventName" | "updatedAt"> & {
  videoPublicId: string; mobileFallbackPublicId: string; updatedBy: number;
}) {
  await ensureVideoPlacementSchema();
  const key = input.placement === "event-page" ? `event-page:${input.eventId}` : input.placement;
  const muted = input.placement === "homepage-hero" && input.autoplay ? true : input.muted;
  await db.execute<ResultSetHeader>(`
    INSERT INTO video_placements (
      placement_key, placement, event_id, generation_id, video_url, video_public_id,
      mobile_fallback_url, mobile_fallback_public_id, headline, supporting_text,
      button_label, button_link, visible, starts_at, ends_at, autoplay, muted,
      loop_video, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      placement = VALUES(placement), event_id = VALUES(event_id),
      generation_id = VALUES(generation_id), video_url = VALUES(video_url),
      video_public_id = VALUES(video_public_id),
      mobile_fallback_url = VALUES(mobile_fallback_url),
      mobile_fallback_public_id = VALUES(mobile_fallback_public_id),
      headline = VALUES(headline), supporting_text = VALUES(supporting_text),
      button_label = VALUES(button_label), button_link = VALUES(button_link),
      visible = VALUES(visible), starts_at = VALUES(starts_at), ends_at = VALUES(ends_at),
      autoplay = VALUES(autoplay), muted = VALUES(muted), loop_video = VALUES(loop_video),
      updated_by = VALUES(updated_by)
  `, [key, input.placement, input.eventId, input.generationId, input.videoUrl,
    input.videoPublicId, input.mobileFallbackUrl || null, input.mobileFallbackPublicId || null,
    input.headline || null, input.supportingText || null, input.buttonLabel || null,
    input.buttonLink || null, input.visible ? 1 : 0, input.startsAt || null,
    input.endsAt || null, input.autoplay ? 1 : 0, muted ? 1 : 0,
    input.loop ? 1 : 0, input.updatedBy]);
}

export async function setVideoPlacementVisibility(id: number, visible: boolean) {
  await ensureVideoPlacementSchema();
  await db.execute(`UPDATE video_placements SET visible = ? WHERE id = ?`, [visible ? 1 : 0, id]);
}

export async function removeVideoPlacement(id: number) {
  await ensureVideoPlacementSchema();
  await db.execute(`DELETE FROM video_placements WHERE id = ?`, [id]);
}

function mapPlacement(row: PlacementRow): VideoPlacement {
  return {
    id: Number(row.id), placement: row.placement, eventId: row.event_id ? Number(row.event_id) : null,
    eventName: row.event_name || "", generationId: Number(row.generation_id), videoUrl: row.video_url,
    mobileFallbackUrl: row.mobile_fallback_url || "", headline: row.headline || "",
    supportingText: row.supporting_text || "", buttonLabel: row.button_label || "",
    buttonLink: row.button_link || "", visible: Boolean(row.visible), startsAt: row.starts_at,
    endsAt: row.ends_at, autoplay: Boolean(row.autoplay), muted: Boolean(row.muted),
    loop: Boolean(row.loop_video), updatedAt: row.updated_at,
  };
}
