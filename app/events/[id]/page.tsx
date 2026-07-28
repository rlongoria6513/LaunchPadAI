import Link from "next/link";
import db from "../../lib/db";

type EventRecord = {
  id: number;
  event_name: string;
  venue: string;
  event_date: string | Date;
  event_time: string;
  ticket_price: number | string;
  image_url: string | null;
};

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await db.execute(
    `
    SELECT
      id,
      event_name,
      venue,
      event_date,
      event_time,
      ticket_price,
      image_url
    FROM events
    WHERE id = ?
    `,
    [id]
  );

  if (!rows.length) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#081225",
          color: "white",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <h1>Event not found</h1>

        <Link
          href="/events"
          style={{
            display: "inline-block",
            marginTop: "20px",
            color: "#67e8f9",
          }}
        >
          ← Back to Events
        </Link>
      </main>
    );
  }

  const event = rows[0] as EventRecord;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 55%, #1e1b4b 100%)",
        color: "white",
        padding: "40px 20px 80px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1150px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/events"
          style={{
            display: "inline-block",
            color: "#67e8f9",
            textDecoration: "none",
            fontWeight: "bold",
            marginBottom: "25px",
          }}
        >
          ← Back to Events
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "35px",
            alignItems: "start",
          }}
        >
          <section>
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={`${event.event_name} flyer`}
                style={{
                  width: "100%",
                  maxHeight: "650px",
                  objectFit: "cover",
                  borderRadius: "20px",
                  display: "block",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
                }}
              />
            ) : (
              <div
                style={{
                  minHeight: "480px",
                  background:
                    "linear-gradient(135deg, #1e293b, #312e81)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "80px",
                  color: "#94a3b8",
                }}
              >
                🎫
              </div>
            )}
          </section>

          <section
            style={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: "20px",
              padding: "30px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
          >
            <p
              style={{
                color: "#67e8f9",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}
            >
              LaunchPad Tickets
            </p>

            <h1
              style={{
                fontSize: "42px",
                lineHeight: "1.1",
                margin: "0 0 25px",
              }}
            >
              {event.event_name}
            </h1>

            <div
              style={{
                display: "grid",
                gap: "15px",
                padding: "22px 0",
                borderTop: "1px solid #334155",
                borderBottom: "1px solid #334155",
              }}
            >
              <div>
                <p style={labelStyle}>Venue</p>
                <p style={valueStyle}>📍 {event.venue}</p>
              </div>

              <div>
                <p style={labelStyle}>Date</p>
                <p style={valueStyle}>
                  📅 {formatEventDate(event.event_date)}
                </p>
              </div>

              <div>
                <p style={labelStyle}>Time</p>
                <p style={valueStyle}>
                  🕒 {formatEventTime(event.event_time)}
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "25px",
                padding: "22px",
                background: "#0b1220",
                borderRadius: "14px",
                border: "1px solid #263449",
              }}
            >
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                  margin: "0 0 6px",
                }}
              >
                Ticket price
              </p>

              <p
                style={{
                  color: "#67e8f9",
                  fontSize: "34px",
                  fontWeight: "bold",
                  margin: "0 0 20px",
                }}
              >
                ${Number(event.ticket_price).toFixed(2)}
              </p>

              <Link
                href={`/checkout/${event.id}`}
                style={{
                  display: "block",
                  background: "#2563eb",
                  color: "white",
                  textDecoration: "none",
                  textAlign: "center",
                  padding: "16px 20px",
                  borderRadius: "11px",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                Buy Tickets
              </Link>
            </div>

            <p
              style={{
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: "1.5",
                margin: "18px 0 0",
                textAlign: "center",
              }}
            >
              Secure checkout. Your digital ticket and QR code will be
              available after purchase.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatEventDate(dateValue: string | Date) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
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

const labelStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 5px",
};

const valueStyle = {
  color: "#e2e8f0",
  fontSize: "18px",
  margin: 0,
};