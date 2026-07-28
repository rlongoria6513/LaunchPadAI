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

  async function handleCheckout() {
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
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Stripe Checkout failed.");
    }
  }

  return (
    <>
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
        style={{
          width: "100%",
          padding: "18px",
          fontSize: "22px",
          background: "#1DB954",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Pay ${(price * quantity).toFixed(2)} Securely
      </button>
    </>
  );
}