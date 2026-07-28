import mysql from "mysql2/promise";
import Link from "next/link";

type EventRecord = {
  id: number;
  event_name: string;
  venue: string;
  event_date: string | Date;
  event_time: string;
  ticket_price: number | string;
  image_url: string | null;
};

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
      ticket_price,
      image_url
    FROM events
    ORDER BY event_date ASC
  `);

  await connection.end();

  const eventList = events as EventRecord[];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 55%, #1e1b4b 100%)",
        color: "white",
        padding: "50px 20px 80px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "35px" }}>
          <p
            style={{
              color: "#67e8f9",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            LaunchPad Tickets
          </p>

          <h1
            style={{
              fontSize: "42px",
              margin: "0 0 10px",
            }}
          >
            🎟️ Upcoming Events
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "18px",
              margin: 0,
            }}
          >
            Find your next show, festival, or live experience.
          </p>
        </div>

        {eventList.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginTop: 0 }}>No events available</h2>

            <p
              style={{
                color: "#94a3b8",
                marginBottom: 0,
              }}
            >
              New events will appear here when promoters publish them.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "25px",
            }}
          >
            {eventList.map((event) => (
              <article
                key={event.id}
                style={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={`${event.event_name} flyer`}
                    style={{
                      width: "100%",
                      height: "260px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: "260px",
                      background:
                        "linear-gradient(135deg, #1e293b, #312e81)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                      fontSize: "50px",
                    }}
                  >
                    🎫
                  </div>
                )}

                <div
                  style={{
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <h2
                    style={{
                      margin: "0 0 14px",
                      fontSize: "25px",
                      lineHeight: "1.2",
                    }}
                  >
                    {event.event_name}
                  </h2>

                  <p style={detailStyle}>📍 {event.venue}</p>

                  <p style={detailStyle}>
                    📅{" "}
                    {new Date(event.event_date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      }
                    )}
                  </p>

                  <p style={detailStyle}>
                    🕒 {formatEventTime(event.event_time)}
                  </p>

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "18px",
                    }}
                  >
                    <p
                      style={{
                        color: "#67e8f9",
                        fontSize: "22px",
                        fontWeight: "bold",
                        margin: "0 0 16px",
                      }}
                    >
                      ${Number(event.ticket_price).toFixed(2)}
                    </p>

                    <Link
                      href={`/events/${event.id}`}
                      style={{
                        display: "block",
                        background: "#2563eb",
                        color: "white",
                        textDecoration: "none",
                        textAlign: "center",
                        padding: "13px 16px",
                        borderRadius: "10px",
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatEventTime(time: string) {
  if (!time) {
    return "Time to be announced";
  }

  const [hours, minutes] = time.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const detailStyle = {
  color: "#cbd5e1",
  margin: "6px 0",
  lineHeight: "1.5",
};