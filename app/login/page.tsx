import { signIn } from "../auth";
import Link from "next/link";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";

    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1120",
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
          background: "#101c33",
          padding: "30px 24px",
          borderRadius: "15px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Customer Login
        </h1>

        <p
          style={{
            color: "#94a3b8",
            lineHeight: 1.5,
            margin: "0 0 8px",
            textAlign: "center",
          }}
        >
          Log in to view your tickets, profile, and order history.
        </p>

        <form action={login}>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email"
            required
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "20px",
              borderRadius: "8px",
              border: "1px solid #475569",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            required
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "15px",
              borderRadius: "8px",
              border: "1px solid #475569",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "15px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "17px",
              fontWeight: "bold",
            }}
          >
            Login
          </button>
        </form>

        <div
          style={{
            borderTop: "1px solid #334155",
            marginTop: "24px",
            paddingTop: "20px",
            textAlign: "center",
          }}
        >
          <Link
            href="/register"
            style={{
              color: "#93c5fd",
              display: "block",
              fontWeight: "bold",
              marginBottom: "12px",
              textDecoration: "none",
            }}
          >
            Create Account
          </Link>

          <Link
            href="/promoter-login"
            style={{
              color: "#c4b5fd",
              display: "block",
              fontWeight: "bold",
              marginBottom: "12px",
              textDecoration: "none",
            }}
          >
            Promoter Login
          </Link>

          <Link
            href="/promoter/apply"
            style={{
              color: "#5eead4",
              display: "block",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Become a Promoter
          </Link>
        </div>
      </div>
    </main>
  );
}
