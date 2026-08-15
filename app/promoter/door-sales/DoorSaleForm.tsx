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

type DoorSaleTicket = {
  ticketNumber: string;
  qrCode: string;
};

type DoorSaleResponse = {
  error?: string;
  tickets?: DoorSaleTicket[];
  ticketLink?: string;
  delivery?: { sms: string; message: string };
};

export default function DoorSaleForm({ events }: DoorSaleFormProps) {
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<
    { ticketNumber: string; qrCode: string }[]
  >([]);
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "error" | ""
  >("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketLink, setTicketLink] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    setMessageType("");
    setTickets([]);
    setTicketLink("");
    setDeliveryMessage("");
    setSubmitting(true);

    const formData = new FormData(form);
    const requestedQuantity = Number(formData.get("quantity") || 1);

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
          sms_consent: formData.get("sms_consent") === "on",
          quantity: formData.get("quantity"),
          payment_method: formData.get("payment_method"),
        }),
      });

      let data: DoorSaleResponse = {};

      try {
        data = await response.json();
      } catch {
        if (response.ok) {
          setMessage(
            "Sale was recorded, but LaunchPad could not read the ticket response. Check the register before retrying."
          );
          setMessageType("warning");
          return;
        }
      }

      if (!response.ok) {
        setMessage(data?.error || "Could not create door-sale ticket.");
        setMessageType("error");
        return;
      }

      const createdTickets = Array.isArray(data.tickets)
        ? data.tickets.filter(
            (ticket) =>
              Boolean(ticket.ticketNumber)
          )
        : [];

      setTickets(createdTickets);
      setTicketLink(String(data.ticketLink || ""));
      setDeliveryMessage(data.delivery?.message || "");

      if (createdTickets.length === requestedQuantity) {
        setMessage(
          `${createdTickets.length} ${
            createdTickets.length === 1 ? "ticket" : "tickets"
          } created successfully.`
        );
        setMessageType("success");
        form.reset();
        return;
      }

      if (createdTickets.length > 0) {
        setMessage(
          `${createdTickets.length} of ${requestedQuantity} tickets were returned. Keep these ticket links and check the register before retrying.`
        );
        setMessageType("warning");
        return;
      }

      setMessage(
        "Sale completed, but no ticket links were returned. Check the register before retrying."
      );
      setMessageType("warning");
    } catch (error) {
      console.error("Door sale error:", error);
      setMessage(
        "LaunchPad could not confirm the sale response. Check the register before retrying."
      );
      setMessageType("error");
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
          placeholder="Customer name"
          required
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
          placeholder="Mobile number"
          required
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", alignItems: "flex-start", gap: "9px", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.5 }}>
        <input name="sms_consent" type="checkbox" required style={{ marginTop: "3px" }} />
        Customer agrees to receive a transactional text containing the secure ticket link. Message and data rates may apply. Reply STOP to opt out or HELP for help.
      </label>

      <label style={fieldStyle}>
        Payment Method
        <select name="payment_method" defaultValue="cash" required style={inputStyle}>
          <option value="cash">Cash</option>
          <option value="card">Card / External Terminal</option>
        </select>
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
            background:
              messageType === "success"
                ? "rgba(22, 163, 74, 0.16)"
                : messageType === "warning"
                  ? "rgba(234, 179, 8, 0.16)"
                  : "rgba(220, 38, 38, 0.16)",
            border:
              messageType === "success"
                ? "1px solid rgba(74, 222, 128, 0.42)"
                : messageType === "warning"
                  ? "1px solid rgba(250, 204, 21, 0.42)"
                  : "1px solid rgba(248, 113, 113, 0.42)",
            borderRadius: "10px",
            color:
              messageType === "success"
                ? "#86efac"
                : messageType === "warning"
                  ? "#fef3c7"
                  : "#fca5a5",
            margin: 0,
            padding: "12px",
          }}
        >
          {message}
        </p>
      ) : null}

      {tickets.length ? (
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "14px",
          }}
        >
          <strong>Created tickets</strong>
          {deliveryMessage ? <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>{deliveryMessage}</p> : null}
          <div style={{ display: "grid", gap: "6px", marginTop: "10px" }}>
            {tickets.map((ticket) => (
              <div
                key={ticket.ticketNumber}
                style={{
                  display: "grid",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#bae6fd", overflowWrap: "anywhere" }}>
                  {ticket.ticketNumber}
                </span>
                <img src={ticket.qrCode} alt="Ticket QR code" style={{ background: "white", borderRadius: "8px", maxWidth: "220px", padding: "8px", width: "100%" }} />
              </div>
            ))}
          </div>
          {ticketLink ? <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
            <a href={ticketLink} target="_blank" rel="noreferrer" style={actionStyle}>Display Ticket</a>
            <button type="button" style={actionStyle} onClick={() => navigator.clipboard.writeText(`${window.location.origin}${ticketLink}`)}>Copy Link</button>
            <a href={`${ticketLink}?print=1`} target="_blank" rel="noreferrer" style={actionStyle}>Print Ticket</a>
            <button type="button" style={actionStyle} onClick={async () => { const response = await fetch("/api/ticket-delivery/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketLink }) }); const result = await response.json(); setDeliveryMessage(result.message || result.error || "Resend completed."); }}>Resend Text</button>
          </div> : null}
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

const actionStyle = { background: "#0f766e", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", fontWeight: 700, padding: "10px 12px", textDecoration: "none" };
