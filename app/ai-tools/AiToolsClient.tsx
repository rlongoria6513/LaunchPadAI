"use client";

import type { AiSettings, AiTool } from "@/app/lib/aiTools";
import Link from "next/link";
import { useState } from "react";

type AiToolsClientProps = {
  role: string;
  settings: AiSettings;
  limit: number;
  initialUsage: {
    eventDescription: number;
    socialPost: number;
  };
};

type FormState = {
  eventName: string;
  eventDetails: string;
  audience: string;
  tone: string;
  platform: string;
};

const INITIAL_FORM: FormState = {
  eventName: "",
  eventDetails: "",
  audience: "",
  tone: "Exciting and professional",
  platform: "Facebook",
};

export default function AiToolsClient({
  role,
  settings,
  limit,
  initialUsage,
}: AiToolsClientProps) {
  const [tool, setTool] = useState<AiTool>("event-description");
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState(initialUsage);

  const enabled =
    tool === "event-description"
      ? settings.eventDescriptionEnabled
      : settings.socialPostEnabled;
  const used =
    tool === "event-description"
      ? usage.eventDescription
      : usage.socialPost;

  async function generate() {
    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, ...form }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "The AI writer could not complete the request.");
        return;
      }

      setResult(data.result);
      const newUsed = Math.max(limit - Number(data.remaining || 0), 0);
      setUsage((current) => ({
        ...current,
        [tool === "event-description" ? "eventDescription" : "socialPost"]:
          newUsed,
      }));
    } catch {
      setError("The AI writer could not be reached. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy did not work. Select the text and copy it manually.");
    }
  }

  function selectTool(nextTool: AiTool) {
    setTool(nextTool);
    setResult("");
    setError("");
    setCopied(false);
  }

  return (
    <>
      <div className="lp-page-header">
        <div>
          <p className="lp-page-kicker">LaunchPad Creative Studio</p>
          <h1 className="lp-page-title">✨ AI Marketing Tools</h1>
          <p className="lp-page-copy">
            Turn your event details into polished ticket copy and ready-to-post
            social promotion.
          </p>
        </div>

        <div className="ai-header-actions">
          {role === "admin" ? (
            <Link href="/admin/ai-tools" className="lp-button-secondary">
              AI Settings
            </Link>
          ) : null}
          <Link
            href={role === "admin" ? "/admin" : "/promoter"}
            className="lp-button-secondary"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="ai-tool-tabs" aria-label="Choose an AI tool">
        <button
          type="button"
          className={tool === "event-description" ? "is-active" : ""}
          onClick={() => selectTool("event-description")}
        >
          <span>📝</span>
          Event Description Writer
          {!settings.eventDescriptionEnabled ? <small>Disabled</small> : null}
        </button>
        <button
          type="button"
          className={tool === "social-post" ? "is-active" : ""}
          onClick={() => selectTool("social-post")}
        >
          <span>📣</span>
          Social Post Creator
          {!settings.socialPostEnabled ? <small>Disabled</small> : null}
        </button>
      </div>

      <div className="ai-workspace-grid">
        <section className="lp-card ai-form-card">
          <div className="ai-card-heading">
            <div>
              <h2>
                {tool === "event-description"
                  ? "Event Description Writer"
                  : "Social Post Creator"}
              </h2>
              <p>
                {tool === "event-description"
                  ? "Create professional copy for your public event and ticket page."
                  : "Create a promotional post sized for your selected platform."}
              </p>
            </div>
            <span className="ai-usage-pill">
              {used} / {limit} used today
            </span>
          </div>

          {!enabled ? (
            <div className="ai-message ai-message-warning">
              This tool is currently turned off by the LaunchPad administrator.
            </div>
          ) : null}
          {error ? <div className="ai-message ai-message-error">{error}</div> : null}

          <div className="ai-form-grid">
            <label className="ai-field ai-wide">
              Event name
              <input
                value={form.eventName}
                maxLength={160}
                placeholder="Example: Summer Tejano Fest"
                onChange={(event) =>
                  setForm({ ...form, eventName: event.target.value })
                }
              />
            </label>

            <label className="ai-field ai-wide">
              Event details
              <textarea
                value={form.eventDetails}
                maxLength={2500}
                rows={8}
                placeholder="Add the date, time, venue, city, performers, ticket information, age rules, and anything special guests should know."
                onChange={(event) =>
                  setForm({ ...form, eventDetails: event.target.value })
                }
              />
              <small>{form.eventDetails.length} / 2500 characters</small>
            </label>

            <label className="ai-field">
              Target audience
              <input
                value={form.audience}
                maxLength={300}
                placeholder="Families, local music fans..."
                onChange={(event) =>
                  setForm({ ...form, audience: event.target.value })
                }
              />
            </label>

            <label className="ai-field">
              Tone
              <select
                value={form.tone}
                onChange={(event) =>
                  setForm({ ...form, tone: event.target.value })
                }
              >
                <option>Exciting and professional</option>
                <option>Fun and energetic</option>
                <option>Upscale and elegant</option>
                <option>Friendly and local</option>
                <option>Urgent ticket push</option>
              </select>
            </label>

            {tool === "social-post" ? (
              <label className="ai-field ai-wide">
                Social platform
                <select
                  value={form.platform}
                  onChange={(event) =>
                    setForm({ ...form, platform: event.target.value })
                  }
                >
                  <option>Facebook</option>
                  <option>Instagram</option>
                  <option>LinkedIn</option>
                  <option>X</option>
                </select>
              </label>
            ) : null}
          </div>

          <button
            type="button"
            className="lp-button ai-generate-button"
            disabled={!enabled || loading || used >= limit}
            onClick={() => void generate()}
          >
            {loading ? (
              <>
                <span className="ai-spinner" aria-hidden="true" />
                LaunchPad AI is writing...
              </>
            ) : used >= limit ? (
              "Daily limit reached"
            ) : (
              "✨ Generate with AI"
            )}
          </button>
        </section>

        <section className="lp-card ai-result-card" aria-live="polite">
          <div className="ai-result-heading">
            <div>
              <p className="lp-page-kicker">Your Draft</p>
              <h2>Ready to review</h2>
            </div>
            {result ? (
              <button
                type="button"
                className="lp-button-secondary"
                onClick={() => void copyResult()}
              >
                {copied ? "✓ Copied" : "Copy Text"}
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="ai-result-placeholder">
              <span className="ai-spinner ai-spinner-large" aria-hidden="true" />
              <strong>Creating your marketing copy...</strong>
              <p>This may take a few seconds.</p>
            </div>
          ) : result ? (
            <div className="ai-result-output">{result}</div>
          ) : (
            <div className="ai-result-placeholder">
              <span className="ai-placeholder-icon">✨</span>
              <strong>Your AI draft will appear here</strong>
              <p>Enter accurate event details, then select Generate with AI.</p>
            </div>
          )}

          <p className="ai-review-note">
            Always review names, dates, prices, and venue details before publishing.
          </p>
        </section>
      </div>
    </>
  );
}
