"use client";

import { useState } from "react";

type ResetPasswordButtonProps = {
  userId: number;
  name: string;
  email: string;
  role: string;
};

export default function ResetPasswordButton({
  userId,
  name,
  email,
  role,
}: ResetPasswordButtonProps) {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function resetPassword() {
    setMessage("");
    setMessageType("");

    const newPassword = window.prompt(
      `Enter a new temporary password for ${name || email} (${role}).\n\nThe existing password cannot be viewed or recovered.`
    );

    if (newPassword === null) {
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Temporary password must be at least 8 characters.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `Reset the password for ${name || email} (${role})?\n\nThis replaces the current password with the temporary password you entered.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setResetting(true);

      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error || "Could not reset this password.");
        setMessageType("error");
        return;
      }

      setMessage(data?.message || "Temporary password saved.");
      setMessageType("success");
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage("Something went wrong resetting this password.");
      setMessageType("error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <button
        type="button"
        onClick={resetPassword}
        disabled={resetting}
        style={{
          background: resetting ? "#6b7280" : "#2563eb",
          color: "white",
          border: "none",
          padding: "10px 13px",
          borderRadius: "8px",
          cursor: resetting ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {resetting ? "Saving..." : "Reset Password"}
      </button>
      {message ? (
        <span
          style={{
            color: messageType === "success" ? "#86efac" : "#fca5a5",
            fontSize: "13px",
            lineHeight: 1.3,
            maxWidth: "220px",
          }}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
