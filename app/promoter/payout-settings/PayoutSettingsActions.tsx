"use client";

import { useState } from "react";

export default function PayoutSettingsActions({
  hasAccount,
}: {
  hasAccount: boolean;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function openOnboarding() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/stripe/connect/account-link", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        setMessage(data.error || "Could not start Stripe onboarding.");
        return;
      }

      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  async function openDashboard() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/stripe/connect/login-link", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        setMessage(data.error || "Could not open Stripe Express.");
        return;
      }

      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/stripe/connect/account");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not refresh Stripe status.");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="payout-actions">
      <button type="button" onClick={openOnboarding} disabled={loading}>
        {hasAccount ? "Complete Setup" : "Connect Stripe"}
      </button>

      {hasAccount ? (
        <>
          <button type="button" onClick={openDashboard} disabled={loading}>
            Open Express Dashboard
          </button>
          <button type="button" onClick={refreshStatus} disabled={loading}>
            Refresh Status
          </button>
        </>
      ) : null}

      {message ? <p>{message}</p> : null}
    </div>
  );
}
