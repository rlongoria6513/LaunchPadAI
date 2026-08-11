import { auth } from "@/app/auth";
import Link from "next/link";

export default async function PromoterApplyPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const status = params?.status;
  const error = params?.error;
  const isSignedIn = Boolean(session?.user);
  const accountEmail = session?.user?.email || "";
  const showForm = isSignedIn && status !== "success" && status !== "pending";

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
      <style>{`
        .promoter-apply-card {
          width: 100%;
          max-width: 620px;
          background: #101c33;
          border: 1px solid #334155;
          border-radius: 18px;
          padding: 32px 24px;
        }

        .promoter-apply-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 20px;
        }

        .promoter-apply-primary,
        .promoter-apply-secondary {
          border-radius: 10px;
          display: block;
          font-weight: 800;
          padding: 13px 14px;
          text-align: center;
          text-decoration: none;
        }

        .promoter-apply-primary {
          background: #2563eb;
          color: white;
        }

        .promoter-apply-secondary {
          background: rgba(124, 58, 237, 0.18);
          border: 1px solid rgba(196, 181, 253, 0.42);
          color: #ddd6fe;
        }

        .promoter-apply-steps {
          background: rgba(15, 23, 42, 0.62);
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 14px;
          color: #cbd5e1;
          line-height: 1.6;
          margin: 20px 0;
          padding: 16px;
        }

        .promoter-apply-steps strong {
          color: white;
        }

        @media (max-width: 560px) {
          .promoter-apply-card {
            border-radius: 14px;
            padding: 24px 16px;
          }

          .promoter-apply-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div
        className="promoter-apply-card"
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

        <div className="promoter-apply-steps">
          <strong>How promoter access works:</strong> submit an
          application from a signed-in account, wait for admin
          approval, then use Promoter Login after approval. Applying
          does not automatically grant promoter access.
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
            Your request is pending admin approval. You will be able
            to use Promoter Login after an admin approves it.
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

        {!isSignedIn && (
          <div
            style={{
              background: "rgba(37,99,235,0.16)",
              border: "1px solid rgba(96,165,250,0.45)",
              borderRadius: "12px",
              color: "#dbeafe",
              lineHeight: 1.6,
              padding: "16px",
            }}
          >
            Sign in first so your promoter application can be tied to
            your LaunchPad account. If you do not have an account yet,
            create a customer account first, then return here to apply.

            <div className="promoter-apply-actions">
              <Link href="/register" className="promoter-apply-primary">
                Create Account
              </Link>

              <Link href="/login" className="promoter-apply-secondary">
                Customer Login
              </Link>
            </div>
          </div>
        )}

        {showForm && (
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
              autoComplete="name"
              placeholder="Your full name"
              style={inputStyle}
            />

            <label style={labelStyle}>
              Account Email
            </label>

            <input
              type="email"
              value={accountEmail}
              readOnly
              style={{
                ...inputStyle,
                background: "#e5e7eb",
                color: "#111827",
              }}
            />

            <label style={labelStyle}>
              Business / Promoter Name
            </label>

            <input
              name="business_name"
              type="text"
              required
              autoComplete="organization"
              placeholder="Example: LaunchPad Events"
              style={inputStyle}
            />

            <label style={labelStyle}>
              Phone Number
            </label>

            <input
              name="phone"
              type="tel"
              autoComplete="tel"
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
              autoComplete="address-level2"
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
        )}

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
