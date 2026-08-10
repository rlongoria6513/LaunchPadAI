"use client";

import Link from "next/link";
import { useState } from "react";

type FormStatus = {
  type: "success" | "error";
  message: string;
} | null;

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<FormStatus>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      setStatus({
        type: "error",
        message: "Please complete every required field.",
      });
      return;
    }

    if (password.length < 8) {
      setStatus({
        type: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({
          type: "error",
          message:
            data.error ||
            "Could not create your account. Please try again.",
        });
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setStatus({
        type: "success",
        message: "Account created successfully. You can log in now.",
      });
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#0f172a",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "13px 14px",
    fontSize: "16px",
  };

  const labelStyle = {
    display: "grid",
    gap: "7px",
    color: "#e2e8f0",
    fontWeight: 700,
    fontSize: "14px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 55%, #1e1b4b 100%)",
        color: "white",
        padding: "48px 20px 80px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        .register-shell {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(320px, 440px);
          gap: 34px;
          align-items: center;
        }

        .register-copy h1 {
          margin: 0 0 14px;
          font-size: 46px;
          line-height: 1.05;
        }

        .register-copy p {
          margin: 0;
          color: #cbd5e1;
          font-size: 18px;
          line-height: 1.6;
        }

        .register-card {
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
        }

        .register-form {
          display: grid;
          gap: 16px;
        }

        @media (max-width: 820px) {
          .register-shell {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .register-copy h1 {
            font-size: 38px;
          }
        }

        @media (max-width: 520px) {
          .register-shell {
            align-items: start;
          }

          .register-copy h1 {
            font-size: 32px;
          }

          .register-copy p {
            font-size: 16px;
          }

          .register-card {
            padding: 22px 16px;
            border-radius: 14px;
          }
        }
      `}</style>

      <div className="register-shell">
        <section className="register-copy">
          <p
            style={{
              color: "#67e8f9",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Customer Account
          </p>

          <h1>Create Your LaunchPad Account</h1>

          <p>
            Save your ticket history, view QR codes, and get back to your
            event tickets anytime.
          </p>
        </section>

        <section className="register-card">
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "26px",
            }}
          >
            Create Account
          </h2>

          <p
            style={{
              color: "#94a3b8",
              margin: "0 0 22px",
              lineHeight: 1.5,
            }}
          >
            Use the same email you will use to buy tickets.
          </p>

          {status && (
            <div
              role="status"
              style={{
                background:
                  status.type === "success"
                    ? "rgba(22, 163, 74, 0.18)"
                    : "rgba(220, 38, 38, 0.2)",
                border:
                  status.type === "success"
                    ? "1px solid rgba(34, 197, 94, 0.45)"
                    : "1px solid rgba(248, 113, 113, 0.5)",
                color: status.type === "success" ? "#bbf7d0" : "#fecaca",
                borderRadius: "10px",
                padding: "12px 13px",
                marginBottom: "18px",
                lineHeight: 1.45,
              }}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <label style={labelStyle}>
              Full Name
              <input
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Email Address
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Password
              <input
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Confirm Password
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                required
                minLength={8}
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                marginTop: "4px",
                padding: "15px",
                background: submitting ? "#475569" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "17px",
                fontWeight: "bold",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "14px",
              margin: "22px 0 0",
              textAlign: "center",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "#67e8f9",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
