import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { getAiSettings, getAiUsageToday } from "@/app/lib/aiTools";
import { getAiVideoHistory } from "@/app/lib/aiVideo";
import type { RowDataPacket } from "mysql2";
import Link from "next/link";
import { redirect } from "next/navigation";
import PromotionalVideoClient from "./PromotionalVideoClient";

type SessionUser = { id?: unknown; role?: unknown };
type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  image_url: string | null;
  event_date: string | Date;
};

export default async function AdminPromotionalVideoPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);

  if (!session) redirect("/login");
  if (String(user?.role || "").toLowerCase() !== "admin") redirect("/dashboard");

  const [settings, usage, history, eventResult] = await Promise.all([
    getAiSettings(),
    getAiUsageToday(userId),
    getAiVideoHistory(userId),
    db.execute<EventRow[]>(
      `
      SELECT id, event_name, image_url, event_date
      FROM events
      ORDER BY event_date DESC, id DESC
      `
    ),
  ]);
  const events = eventResult[0].map((event) => ({
    id: Number(event.id),
    name: event.event_name,
    imageUrl: event.image_url || "",
    date: event.event_date,
  }));

  return (
    <main className="lp-back-office-page">
      <div className="lp-page-shell">
        <div className="lp-page-header">
          <div>
            <p className="lp-page-kicker">Admin-only AI Studio</p>
            <h1 className="lp-page-title">🎬 Pika Promotional Video Creator</h1>
            <p className="lp-page-copy">
              Animate an event flyer into a 5-second, 720p promotional video.
            </p>
          </div>
          <div className="ai-header-actions">
            <Link href="/admin/ai-tools/video-placement" className="lp-button-secondary">
              Video Placements
            </Link>
            <Link href="/admin/ai-tools" className="lp-button-secondary">
              AI Settings
            </Link>
            <Link href="/admin" className="lp-button-secondary">
              Back to Admin
            </Link>
          </div>
        </div>

        <PromotionalVideoClient
          events={events}
          initialHistory={history}
          enabled={settings.promotionalVideoEnabled}
          limit={settings.promotionalVideoDailyLimit}
          used={Number(usage["promotional-video"] || 0)}
          apiKeyConfigured={Boolean(process.env.FAL_KEY)}
        />
      </div>
    </main>
  );
}
