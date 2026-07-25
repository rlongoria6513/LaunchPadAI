"use client";

import { useState } from "react";

export default function CreateEvent() {
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");

  const saveEvent = async () => {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName,
        venue,
        eventDate,
        eventTime,
        ticketPrice,
      }),
    });

    if (response.ok) {
      alert("✅ Event Saved!");

      setEventName("");
      setVenue("");
      setEventDate("");
      setEventTime("");
      setTicketPrice("");
    } else {
      alert("❌ Failed to save event.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#081225",
        color: "white",
        padding: "60px",
      }}
    >
      <h1>Create Event</h1>

      <div
        style={{
          maxWidth: "600px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "30px",
        }}
      >
        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        <input
          placeholder="Venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />

        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />

        <input
          type="time"
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
        />

        <input
          type="number"
          placeholder="Ticket Price"
          value={ticketPrice}
          onChange={(e) => setTicketPrice(e.target.value)}
        />

        <button
          onClick={saveEvent}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "15px",
            border: "none",
            borderRadius: "10px",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          Save Event
        </button>
      </div>
    </main>
  );
}