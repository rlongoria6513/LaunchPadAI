import Link from "next/link";

export default async function PromoterApplyPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  const status = params?.status;
  const error = params?.error;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 55%, #312e81 100%)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#101c33",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
          }}
        >
          <div style={{ fontSize: "48px" }}>🎤</div>

          <h1
            style={{
              margin: "10px 0 8px",
              fontSize: "30px",
            }}
          >
            Become a Promoter
          </h1>

          <p
            style={{
              color: "#94a3b8",
              lineHeight: "1.5",
              margin: 0,
            }}
          >
            Apply to create events, sell tickets, manage guests,
            and track event sales with LaunchPad.
          </p>
        </div>

        {status === "success" && (
          <div
            style={{
              background: "rgba(34,197,94,0.18)",
              border: "1px solid rgba(34,197,94,0.55)",
              color: "#bbf7d0",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            ✅ Application submitted successfully.
            <br />
            Your request is now waiting for admin approval.
          </div>
        )}

        {status === "pending" && (
          <div
            style={{
              background: "rgba(245,158,11,0.18)",
              border: "1px solid rgba(245,158,11,0.55)",
              color: "#fde68a",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            ⏳ You already have a promoter application pending.
          </div>
        )}

        {error === "missing" && (
          <div
            style={{
              background: "rgba(239,68,68,0.18)",
              border: "1px solid rgba(239,68,68,0.55)",
              color: "#fecaca",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            Please complete all required fields.
          </div>
        )}

        {error === "server" && (
          <div
            style={{
              background: "rgba(239,68,68,0.18)",
              border: "1px solid rgba(239,68,68,0.55)",
              color: "#fecaca",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            Something went wrong submitting your application.
            Please try again.
          </div>
        )}

        <form
          action="/api/promoter/apply"
          method="POST"
        >
          <label style={labelStyle}>
            Full Name
          </label>

          <input
            name="name"
            type="text"
            required
            placeholder="Your full name"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Email
          </label>

          <input
            name="email"
            type="email"
            required
            placeholder="you@email.com"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Business / Promoter Name
          </label>

          <input
            name="business_name"
            type="text"
            required
            placeholder="Example: LaunchPad Events"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Phone Number
          </label>

          <input
            name="phone"
            type="tel"
            placeholder="Optional"
            style={inputStyle}
          />

          <label style={labelStyle}>
            City / Market
          </label>

          <input
            name="city"
            type="text"
            required
            placeholder="Example: Toledo, Ohio"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Tell us about the events you promote
          </label>

          <textarea
            name="description"
            required
            placeholder="Concerts, festivals, clubs, touring bands, community events..."
            rows={5}
            style={{
              ...inputStyle,
              resize: "vertical",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              marginTop: "22px",
              padding: "15px",
              background: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "9px",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Submit Promoter Application
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid #334155",
          }}
        >
          <Link
            href="/promoter-login"
            style={{
              color: "#c4b5fd",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Already approved? Promoter Login →
          </Link>

          <div style={{ marginTop: "16px" }}>
            <Link
              href="/"
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              ← Return Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginTop: "16px",
  marginBottom: "6px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px",
  borderRadius: "9px",
  border: "1px solid #475569",
  fontSize: "16px",
};