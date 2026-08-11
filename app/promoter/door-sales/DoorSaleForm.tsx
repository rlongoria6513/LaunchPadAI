"use client";

import { useState } from "react";

type DoorSaleEvent = {
  id: number;
  eventName: string;
  venue: string;
  ticketPrice: number;
};

type DoorSaleFormProps = {
  events: DoorSaleEvent[];
};

export default function DoorSaleForm({ events }: DoorSaleFormProps) {
  const [message, setMessage] = useState("");
  const [ticketNumbers, setTicketNumbers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setTicketNumbers([]);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/promoter/door-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: formData.get("event_id"),
          customer_name: formData.get("customer_name"),
          customer_email: formData.get("customer_email"),
          customer_phone: formData.get("customer_phone"),
          quantity: formData.get("quantity"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "Could not create door-sale ticket.");
        return;
      }

      setMessage("Door-sale ticket created.");
      setTicketNumbers(data?.ticketNumbers || []);
      event.currentTarget.reset();
    } catch (error) {
      console.error("Door sale error:", error);
      setMessage("Something went wrong creating the door-sale ticket.");
    } finally {
      setSubmitting(false);
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
        Event
        <select name="event_id" required style={inputStyle}>
          <option value="">Choose an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventName} - ${event.ticketPrice.toFixed(2)}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldStyle}>
        Customer Name
        <input
          name="customer_name"
          type="text"
          placeholder="Guest"
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        Customer Email
        <input
          name="customer_email"
          type="email"
          placeholder="Optional email receipt"
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        Customer Phone
        <input
          name="customer_phone"
          type="tel"
          placeholder="Optional"
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        Quantity
        <select name="quantity" defaultValue="1" required style={inputStyle}>
          <option value="1">1 Ticket</option>
          <option value="2">2 Tickets</option>
          <option value="3">3 Tickets</option>
          <option value="4">4 Tickets</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={submitting || events.length === 0}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "9px",
          background:
            submitting || events.length === 0 ? "#64748b" : "#16a34a",
          color: "white",
          cursor:
            submitting || events.length === 0 ? "not-allowed" : "pointer",
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        {submitting ? "Creating..." : "Create Door-Sale Ticket"}
      </button>

      {message ? (
        <p
          style={{
            color:
              message === "Door-sale ticket created."
                ? "#86efac"
                : "#fca5a5",
            margin: 0,
          }}
        >
          {message}
        </p>
      ) : null}

      {ticketNumbers.length ? (
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "14px",
          }}
        >
          <strong>Created ticket numbers</strong>
          <div style={{ display: "grid", gap: "6px", marginTop: "10px" }}>
            {ticketNumbers.map((ticketNumber) => (
              <span
                key={ticketNumber}
                style={{
                  color: "#bae6fd",
                  overflowWrap: "anywhere",
                }}
              >
                {ticketNumber}
              </span>
            ))}
          </div>
        </div>
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
