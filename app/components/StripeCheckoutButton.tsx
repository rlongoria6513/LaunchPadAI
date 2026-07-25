"use client";

type Props = {
  eventName: string;
  price: number;
};

export default function StripeCheckoutButton({
  eventName,
  price,
}: Props) {
  async function handleCheckout() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName,
        price,
        quantity: 1,
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
      Continue to Checkout
    </button>
  );
}