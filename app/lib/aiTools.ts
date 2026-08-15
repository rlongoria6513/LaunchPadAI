import db from "@/app/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type AiTool = "event-description" | "social-post";

export type AiSettings = {
  eventDescriptionEnabled: boolean;
  socialPostEnabled: boolean;
  promoterDailyLimit: number;
  adminDailyLimit: number;
};

type AiSettingsRow = RowDataPacket & {
  event_description_enabled: number | boolean;
  social_post_enabled: number | boolean;
  promoter_daily_limit: number;
  admin_daily_limit: number;
};

type AiUsageRow = RowDataPacket & {
  request_count: number;
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  eventDescriptionEnabled: true,
  socialPostEnabled: true,
  promoterDailyLimit: 20,
  adminDailyLimit: 100,
};

let schemaPromise: Promise<void> | null = null;

export function ensureAiToolsSchema() {
  if (!schemaPromise) {
    schemaPromise = createAiToolsSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

async function createAiToolsSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_tool_settings (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      event_description_enabled TINYINT(1) NOT NULL DEFAULT 1,
      social_post_enabled TINYINT(1) NOT NULL DEFAULT 1,
      promoter_daily_limit INT UNSIGNED NOT NULL DEFAULT 20,
      admin_daily_limit INT UNSIGNED NOT NULL DEFAULT 100,
      updated_by INT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_tool_usage (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      user_role VARCHAR(32) NOT NULL,
      tool VARCHAR(64) NOT NULL,
      usage_date DATE NOT NULL,
      request_count INT UNSIGNED NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY ai_usage_user_tool_day (user_id, tool, usage_date),
      KEY ai_usage_day (usage_date)
    )
  `);

  await db.execute(
    `
    INSERT IGNORE INTO ai_tool_settings (
      id,
      event_description_enabled,
      social_post_enabled,
      promoter_daily_limit,
      admin_daily_limit
    ) VALUES (1, 1, 1, 20, 100)
    `
  );
}

export async function getAiSettings(): Promise<AiSettings> {
  await ensureAiToolsSchema();

  const [rows] = await db.execute<AiSettingsRow[]>(
    `
    SELECT
      event_description_enabled,
      social_post_enabled,
      promoter_daily_limit,
      admin_daily_limit
    FROM ai_tool_settings
    WHERE id = 1
    LIMIT 1
    `
  );

  if (!rows.length) {
    return DEFAULT_AI_SETTINGS;
  }

  return {
    eventDescriptionEnabled: Boolean(rows[0].event_description_enabled),
    socialPostEnabled: Boolean(rows[0].social_post_enabled),
    promoterDailyLimit: normalizeLimit(
      rows[0].promoter_daily_limit,
      DEFAULT_AI_SETTINGS.promoterDailyLimit
    ),
    adminDailyLimit: normalizeLimit(
      rows[0].admin_daily_limit,
      DEFAULT_AI_SETTINGS.adminDailyLimit
    ),
  };
}

export async function saveAiSettings(
  input: Partial<AiSettings>,
  updatedBy: number
) {
  await ensureAiToolsSchema();

  const settings: AiSettings = {
    eventDescriptionEnabled: Boolean(input.eventDescriptionEnabled),
    socialPostEnabled: Boolean(input.socialPostEnabled),
    promoterDailyLimit: normalizeLimit(
      input.promoterDailyLimit,
      DEFAULT_AI_SETTINGS.promoterDailyLimit
    ),
    adminDailyLimit: normalizeLimit(
      input.adminDailyLimit,
      DEFAULT_AI_SETTINGS.adminDailyLimit
    ),
  };

  await db.execute<ResultSetHeader>(
    `
    INSERT INTO ai_tool_settings (
      id,
      event_description_enabled,
      social_post_enabled,
      promoter_daily_limit,
      admin_daily_limit,
      updated_by
    ) VALUES (1, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      event_description_enabled = VALUES(event_description_enabled),
      social_post_enabled = VALUES(social_post_enabled),
      promoter_daily_limit = VALUES(promoter_daily_limit),
      admin_daily_limit = VALUES(admin_daily_limit),
      updated_by = VALUES(updated_by)
    `,
    [
      settings.eventDescriptionEnabled ? 1 : 0,
      settings.socialPostEnabled ? 1 : 0,
      settings.promoterDailyLimit,
      settings.adminDailyLimit,
      updatedBy || null,
    ]
  );

  return settings;
}

export function isAiToolEnabled(settings: AiSettings, tool: AiTool) {
  return tool === "event-description"
    ? settings.eventDescriptionEnabled
    : settings.socialPostEnabled;
}

export function getDailyLimit(settings: AiSettings, role: string) {
  return role === "admin"
    ? settings.adminDailyLimit
    : settings.promoterDailyLimit;
}

export async function reserveAiUsage(input: {
  userId: number;
  role: string;
  tool: AiTool;
  limit: number;
}) {
  await ensureAiToolsSchema();

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `
      INSERT INTO ai_tool_usage (
        user_id,
        user_role,
        tool,
        usage_date,
        request_count
      ) VALUES (?, ?, ?, UTC_DATE(), 0)
      ON DUPLICATE KEY UPDATE user_role = VALUES(user_role)
      `,
      [input.userId, input.role, input.tool]
    );

    const [rows] = await connection.execute<AiUsageRow[]>(
      `
      SELECT request_count
      FROM ai_tool_usage
      WHERE user_id = ?
        AND tool = ?
        AND usage_date = UTC_DATE()
      LIMIT 1
      FOR UPDATE
      `,
      [input.userId, input.tool]
    );

    const used = Number(rows[0]?.request_count || 0);

    if (used >= input.limit) {
      await connection.rollback();
      return { allowed: false as const, used, remaining: 0 };
    }

    await connection.execute(
      `
      UPDATE ai_tool_usage
      SET request_count = request_count + 1
      WHERE user_id = ?
        AND tool = ?
        AND usage_date = UTC_DATE()
      `,
      [input.userId, input.tool]
    );
    await connection.commit();

    return {
      allowed: true as const,
      used: used + 1,
      remaining: Math.max(input.limit - used - 1, 0),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function releaseAiUsage(userId: number, tool: AiTool) {
  await ensureAiToolsSchema();
  await db.execute(
    `
    UPDATE ai_tool_usage
    SET request_count = GREATEST(request_count - 1, 0)
    WHERE user_id = ?
      AND tool = ?
      AND usage_date = UTC_DATE()
    `,
    [userId, tool]
  );
}

export async function getAiUsageToday(userId: number) {
  await ensureAiToolsSchema();

  const [rows] = await db.execute<(AiUsageRow & { tool: string })[]>(
    `
    SELECT tool, request_count
    FROM ai_tool_usage
    WHERE user_id = ?
      AND usage_date = UTC_DATE()
    `,
    [userId]
  );

  return rows.reduce<Record<string, number>>((usage, row) => {
    usage[row.tool] = Number(row.request_count || 0);
    return usage;
  }, {});
}

function normalizeLimit(value: unknown, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    return fallback;
  }

  return parsed;
}
