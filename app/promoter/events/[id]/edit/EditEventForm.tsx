"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type EditEventFormProps = {
  eventId: number;
  eventName: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  ticketPrice: string;
};

export default function EditEventForm({
  eventId,
  eventName,
  venue,
  eventDate,
  eventTime,
  ticketPrice,
}: EditEventFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/promoter/events/${eventId}`, {
        method: "PUT",
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
        setMessage(data?.error || "Could not save this event.");
        return;
      }

      setMessage("Event updated.");
      router.refresh();
    } catch (error) {
      console.error("Update event error:", error);
      setMessage("Something went wrong saving this event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#1f2937",
        border: "1px solid #374151",
        borderRadius: "14px",
        padding: "24px",
        display: "grid",
        gap: "16px",
      }}
    >
      <label style={fieldStyle}>
        Event Name
        <input
          name="event_name"
          type="text"
          defaultValue={eventName}
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        Venue
        <input
          name="venue"
          type="text"
          defaultValue={venue}
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        Date
        <input
          name="event_date"
          type="date"
          defaultValue={eventDate}
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        Time
        <input
          name="event_time"
          type="time"
          defaultValue={eventTime}
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        Ticket Price ($)
        <input
          name="ticket_price"
          type="number"
          min="0"
          step="0.01"
          defaultValue={ticketPrice}
          required
          style={inputStyle}
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "9px",
          background: saving ? "#64748b" : "#2563eb",
          color: "white",
          cursor: saving ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        {saving ? "Saving..." : "Save Event"}
      </button>

      {message ? (
        <p
          style={{
            color: message === "Event updated." ? "#86efac" : "#fca5a5",
            margin: 0,
          }}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

const fieldStyle = {
  display: "grid",
  gap: "7px",
  fontWeight: 700,
};

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
