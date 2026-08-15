"use client";

/* eslint-disable @next/next/no-img-element -- previews include local blob and fal.ai URLs */

import type { AiVideoHistoryItem } from "@/app/lib/aiVideo";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type EventOption = {
  id: number;
  name: string;
  imageUrl: string;
  date: string | Date;
};

type Props = {
  events: EventOption[];
  initialHistory: AiVideoHistoryItem[];
  enabled: boolean;
  limit: number;
  used: number;
  apiKeyConfigured: boolean;
};

const ESTIMATED_COST = "$0.20";

export default function PromotionalVideoClient({
  events,
  initialHistory,
  enabled,
  limit,
  used,
  apiKeyConfigured,
}: Props) {
  const [eventId, setEventId] = useState(events[0]?.id || 0);
  const [motionPrompt, setMotionPrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [remaining, setRemaining] = useState(Math.max(limit - used, 0));
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [eventId, events]
  );
  const sourcePreview = imagePreview || selectedEvent?.imageUrl || "";
  const latestVideo = history.find((item) => item.status === "completed" && item.videoUrl);
  const canGenerate =
    enabled && apiKeyConfigured && remaining > 0 && events.length > 0 && !generating;

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
    setError("");
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!canGenerate) return;
    if (!sourcePreview) {
      setError("This event has no flyer. Upload an image first.");
      return;
    }
    if (motionPrompt.trim().length < 10) {
      setError("Describe the motion you want using at least 10 characters.");
      return;
    }
    if (
      !window.confirm(
        `Generate this 5-second 720p video now? Estimated fal.ai cost: ${ESTIMATED_COST}.`
      )
    ) {
      return;
    }

    setGenerating(true);
    setProgress("Uploading the image and submitting to Pika 2.2...");

    try {
      const formData = new FormData();
      formData.append("eventId", String(eventId));
      formData.append("motionPrompt", motionPrompt.trim());
      if (image) formData.append("image", image);

      const response = await fetch("/api/admin/ai-video", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Video generation could not start.");

      setRemaining(Number(data.remaining));
      await refreshHistory();
      await pollGeneration(Number(data.id));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Video generation failed. Please try again."
      );
    } finally {
      setGenerating(false);
      setProgress("");
    }
  }

  async function pollGeneration(id: number) {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      await wait(2000);
      const response = await fetch(`/api/admin/ai-video/${id}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not check video progress.");

      const item = data.item as AiVideoHistoryItem;
      setHistory((current) => [
        item,
        ...current.filter((historyItem) => historyItem.id !== item.id),
      ]);

      if (item.status === "queued") {
        setProgress("Queued at fal.ai — waiting for Pika 2.2...");
      } else if (item.status === "processing") {
        setProgress("Pika 2.2 is animating your flyer...");
      } else if (item.status === "completed") {
        setProgress("Video complete.");
        return;
      } else if (item.status === "failed") {
        setRemaining((current) => Math.min(current + 1, limit));
        throw new Error(item.errorMessage || "Pika 2.2 could not generate the video.");
      }
    }
    throw new Error("Generation is still taking longer than expected. It remains in history.");
  }

  async function refreshHistory() {
    const response = await fetch("/api/admin/ai-video", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setHistory(data.history || []);
    }
  }

  return (
    <>
      {!enabled ? (
        <div className="ai-message ai-message-warning">
          Promotional videos are disabled. Turn them on in AI Settings before generating.
        </div>
      ) : null}
      {!apiKeyConfigured ? (
        <div className="ai-message ai-message-error">
          FAL_KEY is missing from the server environment.
        </div>
      ) : null}
      {error ? <div className="ai-message ai-message-error">{error}</div> : null}

      <div className="ai-video-grid">
        <form className="lp-card ai-video-form" onSubmit={generate}>
          <div className="ai-card-heading">
            <div>
              <h2>Create a video</h2>
              <p>Choose an event and animate its flyer or a replacement image.</p>
            </div>
            <span className="ai-usage-pill">{remaining} of {limit} left today</span>
          </div>

          <label className="ai-field">
            Event
            <select
              value={eventId}
              onChange={(event) => {
                setEventId(Number(event.target.value));
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                setImage(null);
                setImagePreview("");
              }}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </label>

          <label className="ai-field">
            Optional replacement image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={selectImage}
            />
            <small>JPG, PNG, WebP, GIF, or AVIF · maximum 10 MB</small>
          </label>

          {sourcePreview ? (
            <img className="ai-video-source-preview" src={sourcePreview} alt="Video source preview" />
          ) : (
            <div className="ai-video-no-image">No event flyer available—upload an image.</div>
          )}

          <label className="ai-field">
            Motion prompt
            <textarea
              rows={5}
              maxLength={1000}
              value={motionPrompt}
              onChange={(event) => setMotionPrompt(event.target.value)}
              placeholder="Example: Slow cinematic zoom toward the headline, glowing stage lights sweep across the flyer, subtle confetti moves in the background. Keep all text readable."
            />
            <small>{motionPrompt.length}/1000</small>
          </label>

          <div className="ai-video-cost">
            <span>5 seconds · 720p · Pika 2.2</span>
            <strong>Estimated cost: {ESTIMATED_COST}</strong>
          </div>

          <button className="lp-button ai-generate-button" disabled={!canGenerate}>
            {generating ? <><span className="ai-spinner" /> Generating...</> : "Review Cost & Generate"}
          </button>
          {progress ? <div className="ai-video-progress"><span className="ai-spinner" />{progress}</div> : null}
        </form>

        <section className="lp-card ai-result-card">
          <div className="ai-result-heading">
            <div>
              <p className="lp-page-kicker">Latest result</p>
              <h2>Video preview</h2>
            </div>
          </div>
          {latestVideo ? (
            <>
              <video className="ai-video-preview" controls playsInline src={latestVideo.videoUrl} />
              <a className="lp-button ai-video-download" href={latestVideo.videoUrl} download target="_blank" rel="noreferrer">
                Download Video
              </a>
            </>
          ) : (
            <div className="ai-result-placeholder">
              <span className="ai-placeholder-icon">🎞️</span>
              <strong>Your generated video will appear here.</strong>
              <p>Generation can take several minutes. Progress will update automatically.</p>
            </div>
          )}
        </section>
      </div>

      <section className="lp-card ai-video-history-card">
        <div className="ai-result-heading">
          <div><p className="lp-page-kicker">Admin usage</p><h2>Video history</h2></div>
          <button type="button" className="lp-button-secondary" onClick={() => void refreshHistory()}>Refresh</button>
        </div>
        {history.length ? (
          <div className="ai-video-history-list">
            {history.map((item) => (
              <article key={item.id} className="ai-video-history-item">
                <img src={item.sourceImageUrl} alt="" />
                <div>
                  <strong>{item.eventName}</strong>
                  <p>{item.motionPrompt}</p>
                  <small>{formatDate(item.createdAt)} · ${item.estimatedCost.toFixed(2)}</small>
                  {item.errorMessage ? <small className="ai-video-history-error">{item.errorMessage}</small> : null}
                </div>
                <div className="ai-video-history-actions">
                  <span className={`ai-video-status is-${item.status}`}>{statusLabel(item.status)}</span>
                  {item.videoUrl ? <a href={item.videoUrl} target="_blank" rel="noreferrer" download>Download</a> : null}
                </div>
              </article>
            ))}
          </div>
        ) : <p className="ai-settings-copy">No promotional videos have been generated yet.</p>}
      </section>
    </>
  );
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString();
}

function statusLabel(status: string) {
  if (status === "completed") return "Complete";
  if (status === "failed") return "Failed";
  if (status === "processing") return "Generating";
  if (status === "submitting") return "Submitting";
  return "Queued";
}
