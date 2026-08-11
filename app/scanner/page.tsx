import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { redirect } from "next/navigation";
import ScannerClient from "./ScannerClient";
import type { RowDataPacket } from "mysql2";

type SessionUserWithRole = {
  id?: unknown;
  role?: unknown;
};

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
};

export default async function ScannerPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = String(
    (session.user as SessionUserWithRole | undefined)?.role || ""
  ).toLowerCase();
  const userId = Number((session.user as SessionUserWithRole).id || 0);

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  const [events] = await db.execute<EventRow[]>(
    `
    SELECT id, event_name
    FROM events
    WHERE ? = 'admin'
      OR promoter_id = ?
      OR EXISTS (
        SELECT 1
        FROM event_staff s
        WHERE s.event_id = events.id
          AND s.user_id = ?
          AND s.active = 1
          AND s.can_scan = 1
      )
    ORDER BY event_date ASC
    `,
    [role, userId, userId]
  );

  return (
    <ScannerClient
      events={events.map((event) => ({
        id: event.id,
        eventName: event.event_name,
      }))}
    />
  );
}
