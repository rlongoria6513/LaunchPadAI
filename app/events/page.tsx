import mysql from "mysql2/promise";
import Link from "next/link";

export default async function EventsPage() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [events] = await connection.execute(`
    SELECT
      id,
      event_name,
      venue,
      event_date,
      event_time,
      ticket_price
    FROM events
    ORDER BY event_date ASC
  `);

  await connection.end();

  return (
    <main style={{ padding: "40px", color: "white" }}>
      <h1>🎟️ Events</h1>

      {(events as any[]).length === 0 ? (
        <p>No events available.</p>
      ) : (
        <div style={{ display: "grid", gap: "20px", marginTop: "25px" }}>
          {(events as any[]).map((event) => (
            <div
              key={event.id}
              style={{
                padding: "20px",
                border: "1px solid #374151",
                borderRadius: "10px",
              }}
            >
              <h2>{event.event_name}</h2>
              <p>{event.venue}</p>
              <p>{new Date(event.event_date).toLocaleDateString()}</p>
              <p>{event.event_time}</p>
              <p>${Number(event.ticket_price).toFixed(2)}</p>

              <Link href={`/events/${event.id}`}>
                View Event
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}