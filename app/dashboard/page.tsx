import LogoutButton from "./LogoutButton";
import { redirect } from "next/navigation";
import { auth } from "../auth";

import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();
  const user = session?.user;

  if (!session) {
    redirect("/login");
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
      <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
        🎟️ LaunchPad Tickets
      </h1>
      <p style={{ marginBottom: "30px", color: "#9ca3af" }}>
    Welcome, {user?.name} ({(user as any)?.role})
  </p>
  <LogoutButton />
  {(user as any)?.role === "admin" && (
  <div
    style={{
      background: "#065f46",
      color: "white",
      padding: "15px",
      borderRadius: "10px",
      marginTop: "20px",
      marginBottom: "20px",
    }}
  >
    👑 Administrator Access Enabled
  </div>
)}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        {(user as any)?.role === "admin" && (
  <Link href="/admin" style={card}>
    👑 Admin Panel
  </Link>
)}
        <Link href="/create-event" style={card}>
          ➕ Create Event
        </Link>

        <Link href="/events" style={card}>
          📅 Manage Events
        </Link>

        <div style={card}>
          💰 Ticket Sales
          <br />
          <small>Coming Soon</small>
        </div>

        <div style={card}>
          👥 Customers
          <br />
          <small>Coming Soon</small>
        </div>

        <div style={card}>
          📻 Kaboom Radio
          <br />
          <small>Coming Soon</small>
        </div>

        <div style={card}>
          ⚙️ Settings
          <br />
          <small>Coming Soon</small>
        </div>
      </div>
    </main>
  );
}

const card = {
  background: "#1f2937",
  borderRadius: "15px",
  padding: "35px",
  textDecoration: "none",
  color: "white",
  fontSize: "22px",
  textAlign: "center" as const,
  transition: "0.3s",
};