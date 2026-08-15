"use client";

import PlacedVideo from "@/app/components/PlacedVideo";
import type { VideoPlacement, VideoPlacementName } from "@/app/lib/videoPlacements";
import { useMemo, useState } from "react";

type Video = { id: number; eventId: number; eventName: string; videoUrl: string; createdAt: string | Date };
type Event = { id: number; name: string; imageUrl: string };
const labels: Record<VideoPlacementName, string> = { "homepage-hero": "Homepage Hero", "become-promoter": "Become a Promoter", "featured-events": "Featured Events", "event-page": "Individual Event Page" };

export default function VideoPlacementManager({ initialPlacements, storageConfigured, videos, events }: { initialPlacements: VideoPlacement[]; storageConfigured: boolean; videos: Video[]; events: Event[] }) {
  const [placements, setPlacements] = useState(initialPlacements);
  const [placement, setPlacement] = useState<VideoPlacementName>("homepage-hero");
  const [generationId, setGenerationId] = useState(videos[0]?.id || 0);
  const [eventId, setEventId] = useState(videos[0]?.eventId || events[0]?.id || 0);
  const [headline, setHeadline] = useState(""); const [supportingText, setSupportingText] = useState("");
  const [buttonLabel, setButtonLabel] = useState(""); const [buttonLink, setButtonLink] = useState("");
  const [startsAt, setStartsAt] = useState(""); const [endsAt, setEndsAt] = useState("");
  const [visible, setVisible] = useState(true); const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(true); const [loop, setLoop] = useState(true);
  const [fallback, setFallback] = useState<File | null>(null); const [existingFallbackUrl, setExistingFallbackUrl] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const selectedVideo = videos.find(v => v.id === generationId);
  const preview = useMemo<VideoPlacement | null>(() => selectedVideo ? ({ id: 0, placement, eventId: placement === "event-page" ? eventId : null, eventName: "", generationId, videoUrl: selectedVideo.videoUrl, mobileFallbackUrl: fallback ? URL.createObjectURL(fallback) : existingFallbackUrl, headline, supportingText, buttonLabel, buttonLink, visible, startsAt: startsAt || null, endsAt: endsAt || null, autoplay, muted: placement === "homepage-hero" && autoplay ? true : muted, loop, updatedAt: "" }) : null, [selectedVideo, placement, eventId, generationId, fallback, existingFallbackUrl, headline, supportingText, buttonLabel, buttonLink, visible, startsAt, endsAt, autoplay, muted, loop]);

  function load(item: VideoPlacement) { setPlacement(item.placement); setGenerationId(item.generationId); setEventId(item.eventId || 0); setHeadline(item.headline); setSupportingText(item.supportingText); setButtonLabel(item.buttonLabel); setButtonLink(item.buttonLink); setStartsAt(toLocal(item.startsAt)); setEndsAt(toLocal(item.endsAt)); setVisible(item.visible); setAutoplay(item.autoplay); setMuted(item.muted); setLoop(item.loop); setExistingFallbackUrl(item.mobileFallbackUrl); setFallback(null); setMessage("Loaded. Publish to replace this placement."); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); setMessage(""); const data = new FormData(); Object.entries({ placement, generationId: String(generationId), eventId: String(eventId), headline, supportingText, buttonLabel, buttonLink, startsAt, endsAt, visible: String(visible), autoplay: String(autoplay), muted: String(muted), loop: String(loop), existingFallbackUrl }).forEach(([k,v]) => data.set(k,v)); if (fallback) data.set("fallbackImage", fallback); try { const response = await fetch("/api/admin/video-placements", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Publishing failed."); setPlacements(result.placements); setMessage("Video placement published to durable storage."); } catch (err) { setError(err instanceof Error ? err.message : "Publishing failed."); } finally { setBusy(false); } }
  async function update(id: number, action: "toggle" | "remove", show?: boolean) { if (action === "remove" && !confirm("Remove this video placement? The original Pika video will remain in history.")) return; setError(""); const response = await fetch(action === "remove" ? `/api/admin/video-placements?id=${id}` : "/api/admin/video-placements", { method: action === "remove" ? "DELETE" : "PATCH", headers: action === "toggle" ? { "Content-Type": "application/json" } : undefined, body: action === "toggle" ? JSON.stringify({ id, visible: show }) : undefined }); const result = await response.json(); if (response.ok) setPlacements(result.placements); else setError(result.error || "The placement could not be updated."); }

  return <div className="video-placement-layout">
    <form className="lp-card video-placement-form" onSubmit={submit}>
      <div className={`storage-status ${storageConfigured ? "is-ready" : "is-blocked"}`}><strong>{storageConfigured ? "Durable storage ready" : "Publishing not active"}</strong><span>{storageConfigured ? "Videos are copied to Cloudinary before publishing." : "Add CLOUDINARY_URL in Render to enable Publish/Replace."}</span></div>
      <label>Completed Pika video<select value={generationId} onChange={e => { const id = Number(e.target.value); setGenerationId(id); const v = videos.find(x => x.id === id); if (v) setEventId(v.eventId); }} required><option value="">Select video</option>{videos.map(v => <option key={v.id} value={v.id}>{v.eventName} — #{v.id}</option>)}</select></label>
      <label>Placement<select value={placement} onChange={e => setPlacement(e.target.value as VideoPlacementName)}>{Object.entries(labels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      {placement === "event-page" ? <label>Event<select value={eventId} onChange={e => setEventId(Number(e.target.value))} required><option value="">Select event</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label> : null}
      <label>Headline<input value={headline} maxLength={180} onChange={e => setHeadline(e.target.value)} /></label>
      <label>Supporting text<textarea value={supportingText} maxLength={500} rows={3} onChange={e => setSupportingText(e.target.value)} /></label>
      <div className="placement-two"><label>Button label<input value={buttonLabel} maxLength={80} onChange={e => setButtonLabel(e.target.value)} /></label><label>Button link<input value={buttonLink} maxLength={500} placeholder="/events or https://…" onChange={e => setButtonLink(e.target.value)} /></label></div>
      <div className="placement-two"><label>Start date (optional)<input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label><label>End date (optional)<input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label></div>
      <label>Mobile / reduced-motion fallback<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFallback(e.target.files?.[0] || null)} /></label>
      <div className="placement-checks"><label><input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} /> Show</label><label><input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} /> Autoplay</label><label><input type="checkbox" checked={placement === "homepage-hero" && autoplay ? true : muted} disabled={placement === "homepage-hero" && autoplay} onChange={e => setMuted(e.target.checked)} /> Muted</label><label><input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} /> Loop</label></div>
      {placement === "homepage-hero" && autoplay ? <small>Homepage autoplay is always muted.</small> : null}
      {error ? <p className="ai-error">{error}</p> : null}{message ? <p className="ai-success">{message}</p> : null}
      <button className="lp-button" disabled={busy || !storageConfigured || !videos.length}>{busy ? "Copying to durable storage…" : "Publish / Replace"}</button>
    </form>
    <section className="lp-card"><h2>Preview before publishing</h2>{preview ? <PlacedVideo placement={preview} className="placement-admin-preview" /> : <p>No completed Pika videos are available.</p>}</section>
    <section className="lp-card placement-list"><h2>Published placements</h2>{placements.length ? placements.map(item => <article key={item.id}><video src={item.videoUrl} muted playsInline preload="metadata" /><div><strong>{labels[item.placement]}{item.eventName ? ` — ${item.eventName}` : ""}</strong><span>{item.visible ? "Shown" : "Hidden"}</span></div><div className="placement-actions"><button onClick={() => load(item)}>Replace / Edit</button><button onClick={() => update(item.id, "toggle", !item.visible)}>{item.visible ? "Hide" : "Show"}</button><button className="is-danger" onClick={() => update(item.id, "remove")}>Remove</button></div></article>) : <p>No videos are published yet.</p>}</section>
  </div>;
}
function toLocal(value: string | Date | null) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.valueOf()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16); }
