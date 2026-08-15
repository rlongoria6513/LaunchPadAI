"use client";

import type { AiSettings } from "@/app/lib/aiTools";
import { useState } from "react";

type AiSettingsFormProps = {
  initialSettings: AiSettings;
  apiKeyConfigured: boolean;
  modelName: string;
};

export default function AiSettingsForm({
  initialSettings,
  apiKeyConfigured,
  modelName,
}: AiSettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "AI settings could not be saved.");
        return;
      }

      setSettings(data.settings);
      setMessage("LaunchPad AI settings saved.");
    } catch {
      setError("AI settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ai-admin-grid">
      <section className="lp-card">
        <h2 className="rebrand-section-title">Tool Access</h2>
        <p className="ai-settings-copy">
          Disabled tools remain visible with a clear unavailable message, but
          promoters and admins cannot generate new content with them.
        </p>

        {message ? <div className="rebrand-success">{message}</div> : null}
        {error ? <div className="rebrand-error">{error}</div> : null}

        <div className="ai-settings-list">
          <label className="ai-setting-toggle">
            <span>
              <strong>📝 Event Description Writer</strong>
              <small>Creates polished copy for event and ticket pages.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.eventDescriptionEnabled}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  eventDescriptionEnabled: event.target.checked,
                })
              }
            />
          </label>

          <label className="ai-setting-toggle">
            <span>
              <strong>📣 Social Post Creator</strong>
              <small>Creates posts for Facebook, Instagram, LinkedIn, and X.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.socialPostEnabled}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  socialPostEnabled: event.target.checked,
                })
              }
            />
          </label>
        </div>

        <h2 className="rebrand-section-title ai-limit-title">Daily Limits</h2>
        <p className="ai-settings-copy">
          Limits apply per account, per tool, and reset at midnight UTC. Choose
          between 1 and 1,000 uses.
        </p>

        <div className="ai-limit-grid">
          <label className="ai-field">
            Promoter uses per tool
            <input
              type="number"
              min={1}
              max={1000}
              value={settings.promoterDailyLimit}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  promoterDailyLimit: Number(event.target.value),
                })
              }
            />
          </label>

          <label className="ai-field">
            Admin uses per tool
            <input
              type="number"
              min={1}
              max={1000}
              value={settings.adminDailyLimit}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  adminDailyLimit: Number(event.target.value),
                })
              }
            />
          </label>
        </div>

        <button
          type="button"
          className="lp-button ai-settings-save"
          disabled={saving}
          onClick={() => void saveSettings()}
        >
          {saving ? "Saving..." : "Save AI Settings"}
        </button>
      </section>

      <aside className="lp-card ai-connection-card">
        <p className="lp-page-kicker">Secure Connection</p>
        <h2>OpenAI API Status</h2>
        <div
          className={`ai-api-status ${apiKeyConfigured ? "is-ready" : "is-missing"}`}
        >
          <span>{apiKeyConfigured ? "✓" : "!"}</span>
          <div>
            <strong>
              {apiKeyConfigured ? "API key configured" : "API key required"}
            </strong>
            <small>
              {apiKeyConfigured
                ? "LaunchPad can securely generate AI content."
                : "Add OPENAI_API_KEY to the Render environment before using these tools."}
            </small>
          </div>
        </div>

        <dl className="ai-connection-details">
          <div>
            <dt>Model</dt>
            <dd>{modelName}</dd>
          </div>
          <div>
            <dt>Key location</dt>
            <dd>Server environment only</dd>
          </div>
          <div>
            <dt>Browser exposure</dt>
            <dd>Never exposed</dd>
          </div>
        </dl>

        <p className="ai-security-note">
          The secret key is read only by the protected server route. This page
          reports whether a key exists—it never displays the key itself.
        </p>
      </aside>
    </div>
  );
}
