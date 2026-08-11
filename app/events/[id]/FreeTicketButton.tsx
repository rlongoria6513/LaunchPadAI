"use client";

import Link from "next/link";
import { useState } from "react";

export default function FreeTicketButton({ eventId }: { eventId: number }) {
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function claimTicket() {
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/tickets/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not claim this ticket.");
        return;
      }

      const ticket = data.tickets?.[0];
      setTicketId(ticket?.orderId || null);
      setMessage("Free ticket created.");
    } catch {
      setMessage("Could not claim this ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <button
        type="button"
        onClick={claimTicket}
        disabled={submitting}
        style={{
          background: submitting ? "#64748b" : "#16a34a",
          border: 0,
          borderRadius: "11px",
          color: "white",
          cursor: submitting ? "not-allowed" : "pointer",
          fontSize: "18px",
          fontWeight: 800,
          padding: "16px 20px",
          width: "100%",
        }}
      >
        {submitting ? "Creating Ticket..." : "Get Free Ticket"}
      </button>

      {message ? (
        <p
          style={{
            color: ticketId ? "#86efac" : "#fca5a5",
            margin: 0,
            textAlign: "center",
          }}
        >
          {message}
        </p>
      ) : null}

      {ticketId ? (
        <Link
          href={`/tickets/${ticketId}`}
          style={{
            color: "#67e8f9",
            fontWeight: 800,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          View Ticket
        </Link>
      ) : null}
    </div>
  );
}
