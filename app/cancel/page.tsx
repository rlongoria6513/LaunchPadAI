import Link from "next/link";

export default function CancelPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#081225",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#101c33",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "32px",
          }}
        >
          Checkout Canceled
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          Your payment was not completed, and no ticket was purchased.
        </p>

        <Link
          href="/events"
          style={{
            display: "inline-block",
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            padding: "13px 20px",
            borderRadius: "10px",
            fontWeight: "bold",
          }}
        >
          Back to Events
        </Link>
      </section>
    </main>
  );
}
