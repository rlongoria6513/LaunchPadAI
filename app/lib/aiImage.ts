import db from "@/app/lib/db";
import { ensureAiToolsSchema } from "@/app/lib/aiTools";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const QWEN_IMAGE_ESTIMATED_COST = 0.035;

export type AiImageHistoryItem = {
  id: number;
  eventId: number;
  eventName: string;
  mode: string;
  imageSize: string;
  prompt: string;
  sourceImageUrl: string;
  status: string;
  resultImageUrl: string;
  errorMessage: string;
  estimatedCost: number;
  usedAsFlyerAt: string | Date | null;
  createdAt: string | Date;
};

export type AiImageRow = RowDataPacket & {
  id: number;
  user_id: number;
  user_role: string;
  event_id: number;
  event_name: string;
  mode: string;
  image_size: string;
  prompt: string;
  source_image_url: string | null;
  fal_endpoint: string;
  fal_request_id: string | null;
  status: string;
  result_image_url: string | null;
  error_message: string | null;
  estimated_cost: number | string;
  used_as_flyer_at: string | Date | null;
  created_at: string | Date;
};

export async function createAiImageGeneration(input: {
  userId: number;
  role: string;
  eventId: number;
  eventName: string;
  mode: string;
  imageSize: string;
  prompt: string;
  sourceImageUrl: string;
  endpoint: string;
}) {
  await ensureAiToolsSchema();
  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO ai_image_generations (
      user_id, user_role, event_id, event_name, mode, image_size, prompt,
      source_image_url, fal_endpoint, status, estimated_cost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitting', ?)
    `,
    [
      input.userId,
      input.role,
      input.eventId,
      input.eventName,
      input.mode,
      input.imageSize,
      input.prompt,
      input.sourceImageUrl || null,
      input.endpoint,
      QWEN_IMAGE_ESTIMATED_COST,
    ]
  );
  return result.insertId;
}

export async function markAiImageQueued(id: number, requestId: string) {
  await db.execute(
    `UPDATE ai_image_generations SET fal_request_id = ?, status = 'queued' WHERE id = ?`,
    [requestId, id]
  );
}

export async function markAiImageProgress(id: number, status: string) {
  await db.execute(
    `UPDATE ai_image_generations SET status = ? WHERE id = ? AND status <> 'completed'`,
    [status, id]
  );
}

export async function markAiImageCompleted(id: number, imageUrl: string) {
  await db.execute(
    `
    UPDATE ai_image_generations
    SET status = 'completed', result_image_url = ?, error_message = NULL,
        completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [imageUrl, id]
  );
}

export async function markAiImageFailed(id: number, message: string) {
  await db.execute(
    `
    UPDATE ai_image_generations
    SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [message.slice(0, 500), id]
  );
}

export async function getAiImageGeneration(id: number, userId: number) {
  await ensureAiToolsSchema();
  const [rows] = await db.execute<AiImageRow[]>(
    `SELECT * FROM ai_image_generations WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

export async function getAiImageHistory(userId: number, limit = 30) {
  await ensureAiToolsSchema();
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 50));
  const [rows] = await db.execute<AiImageRow[]>(
    `
    SELECT * FROM ai_image_generations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
    `,
    [userId]
  );
  return rows.map(toAiImageHistoryItem);
}

export async function markAiImageUsedAsFlyer(id: number) {
  await db.execute(
    `UPDATE ai_image_generations SET used_as_flyer_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id]
  );
}

export function toAiImageHistoryItem(row: AiImageRow): AiImageHistoryItem {
  return {
    id: Number(row.id),
    eventId: Number(row.event_id),
    eventName: row.event_name,
    mode: row.mode,
    imageSize: row.image_size,
    prompt: row.prompt,
    sourceImageUrl: row.source_image_url || "",
    status: row.status,
    resultImageUrl: row.result_image_url || "",
    errorMessage: row.error_message || "",
    estimatedCost: Number(row.estimated_cost || QWEN_IMAGE_ESTIMATED_COST),
    usedAsFlyerAt: row.used_as_flyer_at,
    createdAt: row.created_at,
  };
}
