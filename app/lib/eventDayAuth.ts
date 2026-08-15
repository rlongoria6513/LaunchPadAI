import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import type { RowDataPacket } from "mysql2";
import { canUsePromoterTools } from "@/app/lib/promoterSubscriptions";

export type EventDayUser = {
  id: number;
  role: string;
  email?: string | null;
  name?: string | null;
};

type StaffPermission = "scan" | "sell" | "comp";

type StaffRow = RowDataPacket & {
  allowed: number;
};

export async function getEventDayUser() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const id = Number((session.user as { id?: unknown }).id || 0);
  const role = String(
    (session.user as { role?: unknown }).role || ""
  ).toLowerCase();

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  if (role === "promoter" && !(await canUsePromoterTools(id, role))) {
    return null;
  }

  return {
    id,
    role,
    email: session.user.email,
    name: session.user.name,
  };
}

export function isAdmin(user: EventDayUser) {
  return user.role === "admin";
}

export function isPromoter(user: EventDayUser) {
  return user.role === "promoter";
}

export async function canAccessEvent(
  user: EventDayUser,
  eventId: number,
  permission: StaffPermission = "scan"
) {
  if (isAdmin(user)) {
    return true;
  }

  const permissionColumn =
    permission === "comp"
      ? "can_comp"
      : permission === "sell"
        ? "can_sell"
        : "can_scan";

  const [rows] = await db.execute<StaffRow[]>(
    `
    SELECT 1 AS allowed
    FROM events e
    WHERE e.id = ?
      AND (
        e.promoter_id = ?
        OR EXISTS (
          SELECT 1
          FROM event_staff s
          WHERE s.event_id = e.id
            AND s.user_id = ?
            AND s.active = 1
            AND s.${permissionColumn} = 1
          LIMIT 1
        )
      )
    LIMIT 1
    `,
    [eventId, user.id, user.id]
  );

  return rows.length > 0;
}

export function accessibleEventsWhere(user: EventDayUser) {
  if (isAdmin(user)) {
    return {
      sql: "1 = 1",
      params: [] as (string | number)[],
    };
  }

  return {
    sql: `
      (
        e.promoter_id = ?
        OR EXISTS (
          SELECT 1
          FROM event_staff s
          WHERE s.event_id = e.id
            AND s.user_id = ?
            AND s.active = 1
        )
      )
    `,
    params: [user.id, user.id] as (string | number)[],
  };
}
