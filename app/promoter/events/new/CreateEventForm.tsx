"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEventForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "15px" }}>
        <label>Event Name</label>
        <br />
        <input
  type="text"
  name="event_name"
  required
  style={{
    padding: "10px",
    width: "300px",
    background: "white",
    color: "black",
    borderRadius: "6px",
  }}
/>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Venue</label>
        <br />
        <input
  type="text"
  name="venue"
  required
  style={{
    padding: "10px",
    width: "300px",
    background: "white",
    color: "black",
    borderRadius: "6px",
  }}
/>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Date</label>
        <br />
        <input
  type="date"
  name="event_date"
  required
  style={{
    padding: "10px",
    width: "300px",
    background: "white",
    color: "black",
    borderRadius: "6px",
  }}
/>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Time</label>
        <br />
        <input type="time" name="event_time" required />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Ticket Price ($)</label>
        <br />
        <input
  type="number"
  step="0.01"
  min="0"
  name="ticket_price"
  required
  style={{
    padding: "10px",
    width: "300px",
    background: "white",
    color: "black",
    borderRadius: "6px",
  }}
/>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Event"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}