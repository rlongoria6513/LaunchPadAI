import Link from "next/link";
import db from "../../lib/db";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await db.execute(
    "SELECT * FROM events WHERE id = ?",
    [id]
  );

  if (!rows.length) {
    return (
      <main style={{ padding: 40, color: "white", background: "#111827" }}>
        <h1>Event not found</h1>

        <Link href="/events" style={{ color: "#60a5fa" }}>
          Back to Events
        </Link>
      </main>
    );
  }

  const event = rows[0];

  return (
    <main
      style={{
        background: "#111827",
        color: "white",
        minHeight: "100vh",
        padding: 40,
      }}
    >
      <h1>{event.event_name}</h1>
      <h2>{event.venue}</h2>

      <p>Date: {String(event.event_date)}</p>
      <p>Time: {event.event_time}</p>

      <h3>${Number(event.ticket_price).toFixed(2)}</h3>

      <Link
        href={`/checkout/${id}`}
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "12px 24px",
          background: "#0070f3",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 8,
        }}
      >
        Buy Tickets
      </Link>
    </main>
  );
}