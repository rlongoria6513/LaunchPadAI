
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export default async function PromoterPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "promoter") {
    redirect("/dashboard");
  }

  return (
    <main style={{ padding: "40px" , color:  "white" }}>
      <h1>🎤 Promoter Dashboard!</h1>

      <p>Welcome, {(session.user as any).name}!</p>

      <div
  style={{
    marginTop: "30px",
    display: "flex",
    gap: "15px",
  }}
>
        <a
  href="/promoter/events/new"
  style={{
    background: "#16a34a",
    color: "white",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    display: "inline-block",
  }}
>
  Create Event
</a>
<a
  href="/promoter/events"
  style={{
    background: "#2563eb",
    color: "white",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    display: "inline-block",
  }}
>
  My Events
</a>
      </div>
    </main>
  );
}