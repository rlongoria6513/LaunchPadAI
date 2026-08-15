"use client";

import type { BrandingSettings } from "@/app/lib/branding";
import type { CSSProperties } from "react";
import { useState } from "react";

type RebrandingFormProps = {
  initialSettings: BrandingSettings;
};

export default function RebrandingForm({
  initialSettings,
}: RebrandingFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveSettings(reset = false) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/rebranding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset ? { reset: true } : settings),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Branding settings could not be saved.");
        return;
      }

      setSettings(data.settings);
      setMessage(reset ? "Branding reset to LaunchPad defaults." : "Branding saved.");
    } catch {
      setError("Branding settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rebrand-grid">
      <section className="lp-card">
        <h2 className="rebrand-section-title">Brand Settings</h2>

        {message ? <div className="rebrand-success">{message}</div> : null}
        {error ? <div className="rebrand-error">{error}</div> : null}

        <div className="rebrand-form-grid">
          <label className="rebrand-field">
            Site / business name
            <input
              value={settings.siteName}
              maxLength={120}
              onChange={(event) =>
                setSettings({ ...settings, siteName: event.target.value })
              }
            />
          </label>

          <label className="rebrand-field">
            Logo image URL
            <input
              value={settings.logoUrl}
              maxLength={512}
              placeholder="https://... or /images/logo.png"
              onChange={(event) =>
                setSettings({ ...settings, logoUrl: event.target.value })
              }
            />
          </label>

          <label className="rebrand-field">
            Primary brand color
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(event) =>
                setSettings({ ...settings, primaryColor: event.target.value })
              }
            />
          </label>

          <label className="rebrand-field">
            Secondary / accent color
            <input
              type="color"
              value={settings.accentColor}
              onChange={(event) =>
                setSettings({ ...settings, accentColor: event.target.value })
              }
            />
          </label>

          <label className="rebrand-field rebrand-wide">
            Homepage headline
            <input
              value={settings.homepageHeadline}
              maxLength={160}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  homepageHeadline: event.target.value,
                })
              }
            />
          </label>

          <label className="rebrand-field rebrand-wide">
            Footer / business text
            <textarea
              value={settings.footerText}
              maxLength={255}
              rows={3}
              onChange={(event) =>
                setSettings({ ...settings, footerText: event.target.value })
              }
            />
          </label>

          <label className="rebrand-field">
            Support email
            <input
              type="email"
              value={settings.supportEmail}
              maxLength={254}
              placeholder="support@example.com"
              onChange={(event) =>
                setSettings({ ...settings, supportEmail: event.target.value })
              }
            />
          </label>

          <label className="rebrand-toggle">
            <input
              type="checkbox"
              checked={settings.showPoweredBy}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  showPoweredBy: event.target.checked,
                })
              }
            />
            Show “Powered by LaunchPad”
          </label>
        </div>

        <div className="rebrand-actions">
          <button
            type="button"
            className="lp-button"
            disabled={saving}
            onClick={() => void saveSettings(false)}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          <button
            type="button"
            className="lp-button-secondary"
            disabled={saving}
            onClick={() => {
              if (window.confirm("Reset branding to LaunchPad defaults?")) {
                void saveSettings(true);
              }
            }}
          >
            Reset Defaults
          </button>
        </div>
      </section>

      <section className="lp-card">
        <h2 className="rebrand-section-title">Preview</h2>

        <div
          className="rebrand-preview"
          style={
            {
              "--preview-primary": settings.primaryColor,
              "--preview-accent": settings.accentColor,
            } as CSSProperties
          }
        >
          <div className="rebrand-preview-header">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="" />
            ) : (
              <span>{getBrandInitials(settings.siteName)}</span>
            )}
            <strong>{settings.siteName || "LaunchPad"}</strong>
          </div>

          <h3>{settings.homepageHeadline}</h3>
          <p>{settings.footerText}</p>

          <div className="rebrand-preview-actions">
            <span>Primary action</span>
            <span>Secondary action</span>
          </div>

          {settings.supportEmail ? (
            <small>Support: {settings.supportEmail}</small>
          ) : null}

          {settings.showPoweredBy ? (
            <small>Powered by LaunchPad</small>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function getBrandInitials(siteName: string) {
  const words = siteName.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join("");
  return initials.toUpperCase() || "LP";
}
