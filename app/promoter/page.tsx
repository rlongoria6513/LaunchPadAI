
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
      <h1>🎤 Promoter Dashboard</h1>

      <p>Welcome, {(session.user as any).name}!</p>

      <div style={{ marginTop: "30px" }}>
        <a href="/promoter/events/new">
  <button>Create Event</button>
</a>
      </div>
    </main>
  );
}