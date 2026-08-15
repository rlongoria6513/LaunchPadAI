import db from "@/app/lib/db";
import { ensureAiToolsSchema } from "@/app/lib/aiTools";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const PIKA_VIDEO_COST = 0.2;

export type AiVideoHistoryItem = {
  id: number;
  eventId: number;
  eventName: string;
  sourceImageUrl: string;
  motionPrompt: string;
  status: string;
  videoUrl: string;
  errorMessage: string;
  estimatedCost: number;
  createdAt: string | Date;
  completedAt: string | Date | null;
};

type AiVideoRow = RowDataPacket & {
  id: number;
  user_id: number;
  event_id: number;
  event_name: string;
  source_image_url: string;
  motion_prompt: string;
  fal_request_id: string | null;
  status: string;
  video_url: string | null;
  error_message: string | null;
  estimated_cost: number | string;
  created_at: string | Date;
  completed_at: string | Date | null;
};

export async function createAiVideoGeneration(input: {
  userId: number;
  eventId: number;
  eventName: string;
  sourceImageUrl: string;
  motionPrompt: string;
}) {
  await ensureAiToolsSchema();
  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO ai_video_generations (
      user_id, event_id, event_name, source_image_url, motion_prompt,
      status, estimated_cost
    ) VALUES (?, ?, ?, ?, ?, 'submitting', ?)
    `,
    [
      input.userId,
      input.eventId,
      input.eventName,
      input.sourceImageUrl,
      input.motionPrompt,
      PIKA_VIDEO_COST,
    ]
  );
  return result.insertId;
}

export async function markAiVideoQueued(id: number, requestId: string) {
  await db.execute(
    `UPDATE ai_video_generations SET fal_request_id = ?, status = 'queued' WHERE id = ?`,
    [requestId, id]
  );
}

export async function markAiVideoProgress(id: number, status: string) {
  await db.execute(
    `UPDATE ai_video_generations SET status = ? WHERE id = ? AND status <> 'completed'`,
    [status, id]
  );
}

export async function markAiVideoCompleted(id: number, videoUrl: string) {
  await db.execute(
    `
    UPDATE ai_video_generations
    SET status = 'completed', video_url = ?, error_message = NULL,
        completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [videoUrl, id]
  );
}

export async function markAiVideoFailed(id: number, message: string) {
  await db.execute(
    `
    UPDATE ai_video_generations
    SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [message.slice(0, 500), id]
  );
}

export async function getAiVideoGeneration(id: number, userId: number) {
  await ensureAiToolsSchema();
  const [rows] = await db.execute<AiVideoRow[]>(
    `SELECT * FROM ai_video_generations WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function getAiVideoHistory(userId: number, limit = 25) {
  await ensureAiToolsSchema();
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 50));
  const [rows] = await db.execute<AiVideoRow[]>(
    `
    SELECT *
    FROM ai_video_generations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
    `,
    [userId]
  );
  return rows.map(toHistoryItem);
}

export function toHistoryItem(row: AiVideoRow): AiVideoHistoryItem {
  return {
    id: Number(row.id),
    eventId: Number(row.event_id),
    eventName: row.event_name,
    sourceImageUrl: row.source_image_url,
    motionPrompt: row.motion_prompt,
    status: row.status,
    videoUrl: row.video_url || "",
    errorMessage: row.error_message || "",
    estimatedCost: Number(row.estimated_cost || PIKA_VIDEO_COST),
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
