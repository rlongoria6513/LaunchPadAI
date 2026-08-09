import { signIn } from "../auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PromoterLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const loginError = params?.error === "credentials";

  async function promoterLogin(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/promoter",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/promoter-login?error=credentials");
      }

      throw error;
    }
  }

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
          maxWidth: "420px",
          background: "#101c33",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <div style={{ fontSize: "46px" }}>🎤</div>

          <h1
            style={{
              margin: "10px 0 8px",
              fontSize: "30px",
            }}
          >
            Promoter Login
          </h1>

          <p
            style={{
              color: "#94a3b8",
              margin: 0,
              lineHeight: "1.5",
            }}
          >
            Manage events, ticket sales and guest entry.
          </p>
        </div>

        {loginError && (
          <div
            style={{
              background: "#7f1d1d",
              border: "1px solid #ef4444",
              borderRadius: "9px",
              padding: "12px",
              marginBottom: "18px",
              textAlign: "center",
            }}
          >
            Invalid email or password.
          </div>
        )}

        <form action={promoterLogin}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
            }}
          >
            Email
          </label>

          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="promoter@email.com"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "9px",
              border: "1px solid #475569",
              fontSize: "16px",
              boxSizing: "border-box",
              marginBottom: "16px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "6px",
            }}
          >
            Password
          </label>

          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "9px",
              border: "1px solid #475569",
              fontSize: "16px",
              boxSizing: "border-box",
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
            🎤 Login as Promoter
          </button>
        </form>

        <div
          style={{
            borderTop: "1px solid #334155",
            marginTop: "25px",
            paddingTop: "22px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#cbd5e1",
              margin: "0 0 12px",
            }}
          >
            Want to sell tickets on LaunchPad?
          </p>

          <Link
            href="/promoter/apply"
            style={{
              color: "#c4b5fd",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Apply to Become a Promoter →
          </Link>

          <div style={{ marginTop: "22px" }}>
            <Link
              href="/login"
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              👤 Customer Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}