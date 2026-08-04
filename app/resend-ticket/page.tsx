"use client";

import { useState } from "react";

export default function ResendTicketPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleResend() {
    setMessage("Sending...");

    try {
      const res = await fetch("/api/resend-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Tickets have been sent if that email exists.");
      } else {
        setMessage(data.message || "Unable to resend tickets.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
  }

  return (
    <main
      style={{
        background: "#111827",
        color: "white",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1>Resend Your Tickets</h1>

      <p>
        Enter your email address and we'll send your tickets again.
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        autoComplete="email"
        required
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #374151",
          background: "#1f2937",
          color: "white",
          marginTop: "20px",
        }}
      />

      <button
        type="button"
        onClick={handleResend}
        style={{
          display: "block",
          marginTop: "20px",
          padding: "12px 24px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        📧 Send My Tickets
      </button>

      {message && (
        <p
          style={{
            marginTop: "20px",
            color: "#4ade80",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}