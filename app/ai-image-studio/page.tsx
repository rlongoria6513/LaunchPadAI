import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { getAiImageHistory } from "@/app/lib/aiImage";
import { getAiSettings, getAiUsageToday } from "@/app/lib/aiTools";
import type { RowDataPacket } from "mysql2";
import Link from "next/link";
import { redirect } from "next/navigation";
import AiImageStudioClient from "./AiImageStudioClient";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

type SessionUser = { id?: unknown; role?: unknown };
type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  image_url: string | null;
  event_date: string | Date;
};

export default async function AiImageStudioPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  const role = String(user?.role || "").toLowerCase();
  if (!session) redirect("/login");
  if (role !== "admin" && role !== "promoter") redirect("/dashboard");
  const membership=await getMembershipStatus(userId,role); if(!membership.allowed)redirect("/promoter/membership?required=1");

  const [settings, usage, history, eventResult] = await Promise.all([
    getAiSettings(),
    getAiUsageToday(userId),
    getAiImageHistory(userId),
    db.execute<EventRow[]>(
      `
      SELECT id, event_name, image_url, event_date
      FROM events
      WHERE ? = 'admin' OR promoter_id = ?
      ORDER BY event_date DESC, id DESC
      `,
      [role, userId]
    ),
  ]);
  const enabled =
    role === "admin"
      ? settings.imageStudioAdminEnabled
      : settings.imageStudioPromoterEnabled;
  const limit =
    role === "admin"
      ? settings.imageStudioAdminDailyLimit
      : settings.imageStudioPromoterDailyLimit;
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
            <p className="lp-page-kicker">Qwen Image 2</p>
            <h1 className="lp-page-title">🖼️ LaunchPad AI Image Studio</h1>
            <p className="lp-page-copy">
              Create event artwork from a prompt or upload and edit an existing image.
            </p>
          </div>
          <div className="ai-header-actions">
            {role === "admin" ? (
              <Link href="/admin/ai-tools" className="lp-button-secondary">AI Settings</Link>
            ) : null}
            <Link href={role === "admin" ? "/admin" : "/promoter"} className="lp-button-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>

        <AiImageStudioClient
          events={events}
          initialHistory={history}
          enabled={enabled}
          limit={limit}
          used={Number(usage["image-studio"] || 0)}
          role={role as "admin" | "promoter"}
          apiKeyConfigured={Boolean(process.env.FAL_KEY)}
        />
      </div>
    </main>
  );
}
