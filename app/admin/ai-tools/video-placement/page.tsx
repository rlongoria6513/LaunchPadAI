import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { isDurableVideoStorageConfigured } from "@/app/lib/cloudinaryStorage";
import { getVideoPlacements } from "@/app/lib/videoPlacements";
import type { RowDataPacket } from "mysql2";
import Link from "next/link";
import { redirect } from "next/navigation";
import VideoPlacementManager from "./VideoPlacementManager";

type SessionUser = { role?: unknown };
type VideoRow = RowDataPacket & { id: number; event_id: number; event_name: string; video_url: string; created_at: string | Date };
type EventRow = RowDataPacket & { id: number; event_name: string; image_url: string | null };

export default async function VideoPlacementPage() {
  const session = await auth(); const user = session?.user as SessionUser | undefined;
  if (!session) redirect("/login");
  if (String(user?.role || "").toLowerCase() !== "admin") redirect("/dashboard");
  const [placements, videoResult, eventResult] = await Promise.all([
    getVideoPlacements(),
    db.execute<VideoRow[]>(`SELECT id, event_id, event_name, video_url, created_at FROM ai_video_generations WHERE status = 'completed' AND video_url IS NOT NULL ORDER BY completed_at DESC`),
    db.execute<EventRow[]>(`SELECT id, event_name, image_url FROM events ORDER BY event_date DESC, id DESC`),
  ]);
  return <main className="lp-back-office-page"><div className="lp-page-shell">
    <div className="lp-page-header"><div><p className="lp-page-kicker">Admin-only publishing</p><h1 className="lp-page-title">🎞️ Video Placement Manager</h1><p className="lp-page-copy">Publish completed Pika videos across LaunchPad with scheduled, accessible playback.</p></div>
      <div className="ai-header-actions"><Link href="/admin/ai-tools/video" className="lp-button-secondary">Pika Studio</Link><Link href="/admin" className="lp-button-secondary">Back to Admin</Link></div>
    </div>
    <VideoPlacementManager initialPlacements={placements} storageConfigured={isDurableVideoStorageConfigured()}
      videos={videoResult[0].map(v => ({ id: Number(v.id), eventId: Number(v.event_id), eventName: v.event_name, videoUrl: v.video_url, createdAt: v.created_at }))}
      events={eventResult[0].map(e => ({ id: Number(e.id), name: e.event_name, imageUrl: e.image_url || "" }))} />
  </div></main>;
}
