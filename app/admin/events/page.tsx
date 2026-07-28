import DeleteButton from "./DeleteButton";
import Link from "next/link";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import mysql from "mysql2/promise";

type EventRow = {
  id: number;
  event_name: string;
  venue: string;
  event_date: string | Date;
  event_time: string;
  ticket_price: number | string;
};

export default async function AdminEventsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await db.execute(
    "SELECT id, event_name, venue, event_date, event_time, ticket_price FROM events ORDER BY event_date DESC"
  );

  await db.end();

  const events = rows as EventRow[];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link
          href="/admin"
          style={{
            color: "#93c5fd",
            textDecoration: "none",
          }}
        >
          ← Back to Admin Panel
        </Link>

        <h1 style={{ fontSize: "36px", marginTop: "25px" }}>
          🎟️ Manage Events
        </h1>

        <p style={{ color: "#cbd5e1", marginBottom: "30px" }}>
          View and manage every event on LaunchPad AI.
        </p>

        <div style={{ display: "grid", gap: "18px" }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                background: "#111827",
                border: "1px solid #334155",
                borderRadius: "14px",
                padding: "22px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{event.event_name}</h2>

              <p style={{ color: "#cbd5e1" }}>
                <strong>Venue:</strong> {event.venue}
              </p>

              <p style={{ color: "#cbd5e1" }}>
                <strong>Date:</strong>{" "}
                {new Date(event.event_date).toLocaleDateString()}
              </p>

              <p style={{ color: "#cbd5e1" }}>
                <strong>Time:</strong> {event.event_time}
              </p>

              <p style={{ color: "#cbd5e1" }}>
                <strong>Price:</strong> $
                {Number(event.ticket_price).toFixed(2)}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "18px",
                }}
              >
                <Link
                  href={`/events/${event.id}`}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  View
                </Link>

                <Link
                  href={`/promoter/events/${event.id}/edit`}
                  style={{
                    background: "#f59e0b",
                    color: "#111827",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Edit
                </Link>
                <DeleteButton
  eventId={event.id}
  eventName={event.event_name}
/>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <p style={{ color: "#cbd5e1" }}>No events found.</p>
          )}
        </div>
      </div>
    </main>
  );
}