"use client";

import { useState } from "react";

export default function RequestButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitRequest() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/promoter-request", {
      method: "POST",
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Promoter request submitted.");
    } else {
      setMessage(data.error || "Could not submit request.");
    }

    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={submitRequest}
        disabled={loading}
        style={{
          marginTop: "30px",
          padding: "15px 30px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "18px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Submitting..." : "Request Promoter Access"}
      </button>

      {message && (
        <p style={{ marginTop: "20px", color: "#93c5fd" }}>{message}</p>
      )}
    </>
  );
}