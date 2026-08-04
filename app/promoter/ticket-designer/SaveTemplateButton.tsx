"use client";

import { useState } from "react";

type SaveTemplateButtonProps = {
  eventId: number;
  ticketColor: string;
  currentFlyerUrl?: string;
  currentTicketSize?: string;
};

export default function SaveTemplateButton({
  eventId,
  ticketColor,
  currentFlyerUrl = "",
  currentTicketSize = "large",
}: SaveTemplateButtonProps) {
  const [selectedColor, setSelectedColor] = useState(ticketColor);
  const [flyerUrl, setFlyerUrl] = useState(currentFlyerUrl);
  const [ticketSize, setTicketSize] = useState(currentTicketSize);
  const [saving, setSaving] = useState(false);

  async function saveTemplate() {
    try {
      setSaving(true);

      const response = await fetch("/api/ticket-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          template: {
            ticketColor: selectedColor,
            flyerUrl: flyerUrl.trim(),
            ticketSize,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not save ticket template.");
        return;
      }

      alert("Ticket design saved!");
      window.location.reload();
    } catch (error) {
      console.error("Template save error:", error);
      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        marginTop: 25,
        padding: 20,
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 14,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 20,
          fontSize: 22,
        }}
      >
        Edit Ticket Design
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          alignItems: "end",
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontWeight: 700,
          }}
        >
          Ticket Color

          <input
            type="color"
            value={selectedColor}
            onChange={(event) => setSelectedColor(event.target.value)}
            style={{
              width: "100%",
              height: 48,
              border: "1px solid #4b5563",
              borderRadius: 8,
              background: "#1f2937",
              cursor: "pointer",
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontWeight: 700,
          }}
        >
          Ticket Size

          <select
            value={ticketSize}
            onChange={(event) => setTicketSize(event.target.value)}
            style={{
              width: "100%",
              height: 48,
              padding: "0 12px",
              border: "1px solid #4b5563",
              borderRadius: 8,
              background: "#1f2937",
              color: "white",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontWeight: 700,
          }}
        >
          Flyer Image URL

          <input
            type="url"
            value={flyerUrl}
            onChange={(event) => setFlyerUrl(event.target.value)}
            placeholder="Paste the Cloudinary image URL"
            style={{
              width: "100%",
              height: 48,
              padding: "0 12px",
              boxSizing: "border-box",
              border: "1px solid #4b5563",
              borderRadius: 8,
              background: "#1f2937",
              color: "white",
              fontSize: 15,
            }}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={saveTemplate}
        disabled={saving}
        style={{
          marginTop: 20,
          background: saving ? "#64748b" : "#2563eb",
          color: "white",
          border: "none",
          padding: "12px 22px",
          borderRadius: 10,
          cursor: saving ? "not-allowed" : "pointer",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {saving ? "Saving Design..." : "Save Ticket Design"}
      </button>
    </div>
  );
}