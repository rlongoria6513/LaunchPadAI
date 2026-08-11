"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RefundButtonProps = {
  orderId: number;
  disabled?: boolean;
};

export default function RefundButton({
  orderId,
  disabled = false,
}: RefundButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleRefund() {
    const confirmed = window.confirm(
      "Refund this Stripe Connect order? Stripe will reverse the promoter transfer and refund the LaunchPad application fee where Stripe allows it."
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/stripe/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Refund failed.");
      }

      setMessage("Refund submitted to Stripe.");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Refund failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <button
        type="button"
        onClick={handleRefund}
        disabled={disabled || isSubmitting}
        style={{
          width: "100%",
          border: "0",
          borderRadius: "10px",
          padding: "12px 16px",
          background:
            disabled || isSubmitting ? "#475569" : "#dc2626",
          color: "white",
          cursor: disabled || isSubmitting ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {isSubmitting ? "Submitting Refund..." : "Refund Connect Order"}
      </button>

      {message ? (
        <p
          style={{
            margin: "10px 0 0",
            color: isError ? "#fecaca" : "#bbf7d0",
            fontSize: "14px",
          }}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
