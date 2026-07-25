import RequestButton from "./RequestButton";

import { auth } from "../auth";
import { redirect } from "next/navigation";

export default async function RequestPromoterPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>🎤 Become a Promoter</h1>

      <p style={{ marginTop: "20px", color: "#9ca3af" }}>
        Ready to start selling tickets?
      </p>

      <RequestButton />
    </main>
  );
}