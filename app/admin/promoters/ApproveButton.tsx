"use client";

import { useState } from "react";

export default function ApproveButton({
  requestId,
  email,
}: {
  requestId: number;
  email: string;
}) {
  const [isApproving, setIsApproving] = useState(false);

  async function approveRequest() {
    const confirmed = window.confirm(
      `Approve ${email} as a LaunchPad promoter?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsApproving(true);

      const response = await fetch(
        "/api/admin/promoter-approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Could not approve promoter."
        );
        return;
      }

      alert("✅ Promoter approved!");
      window.location.reload();
    } catch (error) {
      console.error(
        "Promoter approval error:",
        error
      );

      alert(
        "Something went wrong approving this promoter."
      );
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={approveRequest}
      disabled={isApproving}
      aria-label={`Approve ${email} as a promoter`}
      style={{
        width: "100%",
        minHeight: "48px",
        background: isApproving ? "#64748b" : "#16a34a",
        color: "white",
        border: "none",
        padding: "14px 16px",
        borderRadius: "10px",
        cursor: isApproving ? "wait" : "pointer",
        fontWeight: "bold",
        fontSize: "16px",
        lineHeight: 1.2,
      }}
    >
      {isApproving ? "Approving..." : "✅ Approve Promoter"}
    </button>
  );
}
