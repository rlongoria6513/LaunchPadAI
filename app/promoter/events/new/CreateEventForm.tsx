"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEventForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px",
    background: "white",
    color: "black",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
  };

  const fieldStyle = {
    display: "grid",
    gap: "7px",
    marginBottom: "15px",
    fontWeight: 700,
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/promoter/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name: formData.get("event_name"),
        venue: formData.get("venue"),
        event_date: formData.get("event_date"),
        event_time: formData.get("event_time"),
        ticket_price: formData.get("ticket_price"),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not create event.");
      setSubmitting(false);
      return;
    }

    router.push("/promoter");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "14px",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div style={fieldStyle}>
        <label>Event Name</label>
        <input
          type="text"
          name="event_name"
          required
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label>Venue</label>
        <input
          type="text"
          name="venue"
          required
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label>Date</label>
        <input
          type="date"
          name="event_date"
          required
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label>Time</label>
        <input
          type="time"
          name="event_time"
          required
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label>Ticket Price ($)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="ticket_price"
          required
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          padding: "14px",
          background: submitting ? "#64748b" : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "9px",
          cursor: submitting ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        {submitting ? "Creating..." : "Create Event"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
