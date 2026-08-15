"use client";

import { useState } from "react";

type Props = {
  eventId: number;
  eventName: string;
  price: number;
};

export default function StripeCheckoutButton({
  eventId,
  eventName,
  price,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setError("");
    if (!name.trim() || !email.trim() || !phone.trim() || !smsConsent) {
      setError("Enter your name, email, mobile number, and confirm ticket-text consent.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        eventName,
        price,
        quantity,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        smsConsent,
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Stripe Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <>
      <label style={labelStyle}>Full Name</label>
      <input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required style={inputStyle} />
      <label style={labelStyle}>Email Address</label>
      <input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" required style={inputStyle} />
      <label style={labelStyle}>Mobile Number</label>
      <input value={phone} onChange={event => setPhone(event.target.value)} type="tel" autoComplete="tel" required style={inputStyle} />
      <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.5, marginBottom: "20px" }}>
        <input type="checkbox" checked={smsConsent} onChange={event => setSmsConsent(event.target.checked)} style={{ marginTop: "3px" }} />
        I agree to receive a transactional text with my secure ticket link. Message and data rates may apply. Reply STOP to opt out or HELP for help.
      </label>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "bold",
        }}
      >
        Quantity
      </label>

      <select
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        style={{
          width: "100%",
          padding: "14px",
          marginBottom: "20px",
          borderRadius: "8px",
        }}
      >
        <option value={1}>1 Ticket</option>
        <option value={2}>2 Tickets</option>
        <option value={3}>3 Tickets</option>
        <option value={4}>4 Tickets</option>
      </select>

      <div
  style={{
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "25px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
    }}
  >
    <span>Price per Ticket</span>
    <strong>${price.toFixed(2)}</strong>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "10px",
    }}
  >
    <span>Quantity</span>
    <strong>{quantity}</strong>
  </div>

  <hr
    style={{
      borderColor: "#334155",
      margin: "15px 0",
    }}
  />

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontSize: "22px",
      fontWeight: "bold",
      color: "#67e8f9",
    }}
  >
    <span>Total</span>
    <span>${(price * quantity).toFixed(2)}</span>
  </div>
</div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "22px",
          background: "#1DB954",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Opening secure checkout…" : `Pay $${(price * quantity).toFixed(2)} Securely`}
      </button>
      {error ? <p style={{ color: "#fca5a5", lineHeight: 1.5 }}>{error}</p> : null}
    </>
  );
}

const labelStyle = { display: "block", marginBottom: "7px", fontWeight: 700 };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "13px", marginBottom: "17px", borderRadius: "9px", border: "1px solid #475569", background: "#111827", color: "white", fontSize: "16px" };
