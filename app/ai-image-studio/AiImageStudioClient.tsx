"use client";

/* eslint-disable @next/next/no-img-element -- previews include local blob and fal.ai URLs */

import type { AiImageHistoryItem } from "@/app/lib/aiImage";
import { ChangeEvent, FormEvent, useState } from "react";

type EventOption = { id: number; name: string; imageUrl: string; date: string | Date };
type Props = {
  events: EventOption[];
  initialHistory: AiImageHistoryItem[];
  enabled: boolean;
  limit: number;
  used: number;
  role: "admin" | "promoter";
  apiKeyConfigured: boolean;
};

const ESTIMATED_COST = "$0.035";
const SIZE_OPTIONS = [
  { value: "event-flyer", label: "Event Flyer", detail: "1200 × 1500" },
  { value: "square-social", label: "Square Social Post", detail: "1200 × 1200" },
  { value: "story", label: "Story", detail: "1080 × 1920" },
  { value: "banner", label: "Banner", detail: "1600 × 900" },
];

export default function AiImageStudioClient({
  events,
  initialHistory,
  enabled,
  limit,
  used,
  role,
  apiKeyConfigured,
}: Props) {
  const [mode, setMode] = useState<"text-to-image" | "edit-image">("text-to-image");
  const [eventId, setEventId] = useState(events[0]?.id || 0);
  const [size, setSize] = useState("event-flyer");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [history, setHistory] = useState(initialHistory);
  const [remaining, setRemaining] = useState(Math.max(limit - used, 0));
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingFlyerId, setSavingFlyerId] = useState(0);

  const latestImage = history.find((item) => item.status === "completed" && item.resultImageUrl);
  const canGenerate =
    enabled && apiKeyConfigured && remaining > 0 && events.length > 0 && !generating;

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setImage(file);
    setUploadPreview(file ? URL.createObjectURL(file) : "");
    setError("");
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!canGenerate) return;
    if (prompt.trim().length < 10) {
      setError("Enter at least 10 characters describing the image or edit.");
      return;
    }
    if (mode === "edit-image" && !image) {
      setError("Upload a JPG, PNG, or WebP image to edit.");
      return;
    }
    if (!window.confirm(`Generate one image now? Estimated fal.ai cost: ${ESTIMATED_COST}.`)) return;

    setGenerating(true);
    setProgress(mode === "edit-image" ? "Uploading your image securely..." : "Submitting to Qwen Image 2...");
    try {
      const formData = new FormData();
      formData.append("eventId", String(eventId));
      formData.append("mode", mode);
      formData.append("size", size);
      formData.append("prompt", prompt.trim());
      if (image) formData.append("image", image);

      const response = await fetch("/api/ai/image", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image generation could not start.");
      setRemaining(Number(data.remaining));
      await refreshHistory();
      await pollGeneration(Number(data.id));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Image generation failed. Please try again."
      );
    } finally {
      setGenerating(false);
      setProgress("");
    }
  }

  async function pollGeneration(id: number) {
    for (let attempt = 0; attempt < 150; attempt += 1) {
      await wait(2000);
      const response = await fetch(`/api/ai/image/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not check image progress.");
      const item = data.item as AiImageHistoryItem;
      setHistory((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);

      if (item.status === "queued") setProgress("Queued at fal.ai — waiting for Qwen Image 2...");
      if (item.status === "processing") setProgress("Qwen Image 2 is creating your artwork...");
      if (item.status === "completed") {
        setMessage("Image complete. You can download it or use it as the event flyer.");
        return;
      }
      if (item.status === "failed") {
        setRemaining((current) => Math.min(current + 1, limit));
        throw new Error(item.errorMessage || "Qwen Image 2 could not create the image.");
      }
    }
    throw new Error("Generation is taking longer than expected. It remains in your history.");
  }

  async function applyAsFlyer(item: AiImageHistoryItem) {
    if (!window.confirm(`Replace the flyer for “${item.eventName}” with this image?`)) return;
    setSavingFlyerId(item.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/ai/image/${item.id}/use-as-flyer`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The event flyer could not be updated.");
      setMessage(`${item.eventName} now uses this image as its flyer.`);
      await refreshHistory();
    } catch (flyerError) {
      setError(flyerError instanceof Error ? flyerError.message : "The event flyer could not be updated.");
    } finally {
      setSavingFlyerId(0);
    }
  }

  async function refreshHistory() {
    const response = await fetch("/api/ai/image", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setHistory(data.history || []);
    }
  }

  return (
    <>
      {!enabled ? <div className="ai-message ai-message-warning">AI Image Studio is disabled for {role === "admin" ? "administrators" : "promoters"}.</div> : null}
      {!apiKeyConfigured ? <div className="ai-message ai-message-error">FAL_KEY is missing from the server environment.</div> : null}
      {error ? <div className="ai-message ai-message-error">{error}</div> : null}
      {message ? <div className="rebrand-success">{message}</div> : null}

      <div className="ai-image-mode-tabs" role="tablist" aria-label="Image Studio mode">
        <button type="button" className={mode === "text-to-image" ? "is-active" : ""} onClick={() => setMode("text-to-image")}>✨ Text to Image</button>
        <button type="button" className={mode === "edit-image" ? "is-active" : ""} onClick={() => setMode("edit-image")}>🪄 Upload &amp; Edit Image</button>
      </div>

      <div className="ai-image-grid">
        <form className="lp-card ai-image-form" onSubmit={generate}>
          <div className="ai-card-heading">
            <div>
              <h2>{mode === "text-to-image" ? "Create new artwork" : "Edit an uploaded image"}</h2>
              <p>{mode === "text-to-image" ? "Describe the event artwork you want." : "Upload an image and explain the changes naturally."}</p>
            </div>
            <span className="ai-usage-pill">{remaining} of {limit} left today</span>
          </div>

          <label className="ai-field">
            Event
            <select value={eventId} onChange={(event) => setEventId(Number(event.target.value))}>
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
            <small>{role === "promoter" ? "Only events you own are available." : "All LaunchPad events are available."}</small>
          </label>

          {mode === "edit-image" ? (
            <label className="ai-field">
              Image to edit
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} />
              <small>JPG, PNG, or WebP · maximum 10 MB</small>
            </label>
          ) : null}
          {mode === "edit-image" && uploadPreview ? <img className="ai-image-upload-preview" src={uploadPreview} alt="Uploaded source preview" /> : null}

          <label className="ai-field">
            {mode === "text-to-image" ? "Image prompt" : "Editing instructions"}
            <textarea
              rows={6}
              maxLength={800}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                mode === "text-to-image"
                  ? "Example: A vibrant Tejano concert flyer with dramatic stage lighting, gold accents, room for the event title, premium professional design..."
                  : "Example: Keep the performers unchanged, replace the background with a dramatic concert stage, add warm gold lighting, and keep all existing text readable."
              }
            />
            <small>{prompt.length}/800</small>
          </label>

          <fieldset className="ai-image-size-fieldset">
            <legend>Output size</legend>
            <div className="ai-image-size-grid">
              {SIZE_OPTIONS.map((option) => (
                <label key={option.value} className={size === option.value ? "is-selected" : ""}>
                  <input type="radio" name="size" value={option.value} checked={size === option.value} onChange={() => setSize(option.value)} />
                  <strong>{option.label}</strong><small>{option.detail}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="ai-video-cost">
            <span>Qwen Image 2 · one PNG image</span>
            <strong>Estimated cost: {ESTIMATED_COST}</strong>
          </div>
          <button className="lp-button ai-generate-button" disabled={!canGenerate}>
            {generating ? <><span className="ai-spinner" /> Generating...</> : "Review Cost & Generate"}
          </button>
          {progress ? <div className="ai-video-progress"><span className="ai-spinner" />{progress}</div> : null}
        </form>

        <section className="lp-card ai-result-card">
          <div className="ai-result-heading"><div><p className="lp-page-kicker">Latest result</p><h2>Image preview</h2></div></div>
          {latestImage ? (
            <>
              <img className="ai-image-result-preview" src={latestImage.resultImageUrl} alt={`Generated artwork for ${latestImage.eventName}`} />
              <div className="ai-image-result-actions">
                <a className="lp-button" href={latestImage.resultImageUrl} download target="_blank" rel="noreferrer">Download Image</a>
                <button type="button" className="lp-button-secondary" disabled={savingFlyerId === latestImage.id} onClick={() => void applyAsFlyer(latestImage)}>
                  {savingFlyerId === latestImage.id ? "Updating..." : "Use as Event Flyer"}
                </button>
              </div>
            </>
          ) : (
            <div className="ai-result-placeholder"><span className="ai-placeholder-icon">🖼️</span><strong>Your generated image will appear here.</strong><p>Progress updates automatically while fal.ai works.</p></div>
          )}
        </section>
      </div>

      <section className="lp-card ai-image-history-card">
        <div className="ai-result-heading"><div><p className="lp-page-kicker">Your usage</p><h2>Image history</h2></div><button type="button" className="lp-button-secondary" onClick={() => void refreshHistory()}>Refresh</button></div>
        {history.length ? (
          <div className="ai-image-history-grid">
            {history.map((item) => (
              <article key={item.id} className="ai-image-history-item">
                {item.resultImageUrl ? <img src={item.resultImageUrl} alt="" /> : item.sourceImageUrl ? <img src={item.sourceImageUrl} alt="" /> : <div className="ai-image-history-placeholder">AI</div>}
                <div className="ai-image-history-body">
                  <div><strong>{item.eventName}</strong><span className={`ai-video-status is-${item.status}`}>{statusLabel(item.status)}</span></div>
                  <p>{item.prompt}</p>
                  <small>{item.mode === "edit-image" ? "Upload & Edit" : "Text to Image"} · {sizeLabel(item.imageSize)} · ${item.estimatedCost.toFixed(3)} · {formatDate(item.createdAt)}</small>
                  {item.errorMessage ? <small className="ai-video-history-error">{item.errorMessage}</small> : null}
                  {item.resultImageUrl ? (
                    <div className="ai-image-history-actions">
                      <a href={item.resultImageUrl} download target="_blank" rel="noreferrer">Download</a>
                      <button type="button" disabled={savingFlyerId === item.id} onClick={() => void applyAsFlyer(item)}>{item.usedAsFlyerAt ? "Use Again as Flyer" : "Use as Event Flyer"}</button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : <p className="ai-settings-copy">No AI images have been generated yet.</p>}
      </section>
    </>
  );
}

function wait(milliseconds: number) { return new Promise((resolve) => window.setTimeout(resolve, milliseconds)); }
function formatDate(value: string | Date) { return new Date(value).toLocaleString(); }
function statusLabel(status: string) {
  if (status === "completed") return "Complete";
  if (status === "failed") return "Failed";
  if (status === "processing") return "Generating";
  if (status === "submitting") return "Submitting";
  return "Queued";
}
function sizeLabel(size: string) { return SIZE_OPTIONS.find((option) => option.value === size)?.label || size; }
