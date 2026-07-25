import { auth } from "../auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  if ((user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        background: "#111827",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>👑 LaunchPad AI Admin Panel</h1>

      <p>Welcome, {(user as any)?.name}</p>

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        <Link href="/admin/users" style={{ textDecoration: "none", color: "inherit" }}>
  <div style={card}>👥 Manage Users</div>
</Link>

        <Link
  href="/admin/promoters"
  style={{ textDecoration: "none", color: "inherit" }}
>
  <div style={card}>🎤 Approve Promoters</div>
</Link>

        <div style={card}>📅 Manage Events</div>

        <div style={card}>💰 Ticket Sales</div>
      </div>
    </main>
  );
}

const card = {
  background: "#1f2937",
  padding: "30px",
  borderRadius: "12px",
  textAlign: "center" as const,
  fontSize: "22px",
};