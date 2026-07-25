"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin() {
    const result = await signIn("credentials", {
  email,
  password,
  redirect: false,
});

if (result?.error) {
  alert("Invalid email or password.");
} else {
  router.push("/dashboard");
}
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
      }}
    >
      <div
        style={{
          background: "#101c33",
          padding: "40px",
          borderRadius: "15px",
          width: "400px",
        }}
      >
        <h1>LaunchPad AI Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "20px",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        />

        <button
          type="button"
          onClick={handleLogin}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
          }}
        >
          Login
        </button>
      </div>
    </main>
  );
}