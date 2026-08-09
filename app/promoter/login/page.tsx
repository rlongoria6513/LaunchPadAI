import { signIn } from "../../auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default function PromoterLoginPage() {
  async function promoterLogin(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/promoter/login?error=credentials");
      }

      throw error;
    }

    redirect("/promoter");
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
          <div style={{ fontSize: "45px" }}>🎤</div>

          <h1
            style={{
              margin: "10px 0 6px",
              fontSize: "30px",
            }}
          >
            Promoter Login
          </h1>

          <p
            style={{
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Manage your events, tickets and sales.
          </p>
        </div>

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
              boxSizing: "border-box",
              padding: "14px",
              borderRadius: "9px",
              border: "1px solid #475569",
              fontSize: "16px",
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
              boxSizing: "border-box",
              padding: "14px",
              borderRadius: "9px",
              border: "1px solid #475569",
              fontSize: "16px",
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
            }}
          >
            🎤 Login as Promoter
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid #334155",
            textAlign: "center",
            color: "#cbd5e1",
          }}
        >
          Not a promoter yet?
          <br />

          <a
            href="/promoter/apply"
            style={{
              display: "inline-block",
              marginTop: "10px",
              color: "#a78bfa",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Apply to Become a Promoter →
          </a>

          <div style={{ marginTop: "18px" }}>
            <a
              href="/login"
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              Customer Login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}