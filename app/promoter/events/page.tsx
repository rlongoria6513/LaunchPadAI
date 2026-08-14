import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  venue: string;
  event_date: string | Date;
  event_time: string;
  ticket_price: number | string;
};

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export default async function PromoterEventsPage() {
  const session = await auth();

  if (!session) {
    redirect("/promoter/login");
  }

  const sessionUser = session.user as SessionUser;
  const role = String(sessionUser?.role || "").toLowerCase();
  const userId = Number(sessionUser?.id || 0);

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  const [events] = await db.execute<EventRow[]>(
    `
    SELECT
      id,
      event_name,
      venue,
      event_date,
      event_time,
      ticket_price
    FROM events
    WHERE
      ? = 'admin'
      OR promoter_id = ?
    ORDER BY event_date DESC
    `,
    [role, userId]
  );

  return (
    <main
      className="lp-back-office-page"
      style={{
        minHeight: "100vh",
      }}
    >
      <div className="lp-page-shell" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <h1 style={{ margin: 0 }}>🎤 My Events</h1>

          <Link
            href="/promoter/events/new"
            style={{
              background: "#2563eb",
              color: "white",
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            + Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <p>No events created yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  background: "#1f2937",
                  padding: "24px",
                  borderRadius: "12px",
                  border: "1px solid #374151",
                }}
              >
                <h2 style={{ marginTop: 0 }}>
                  {event.event_name}
                </h2>

                <p>{event.venue}</p>

                <p>
                  {new Date(event.event_date).toLocaleDateString()} at{" "}
                  {event.event_time}
                </p>

                <p>
                  ${Number(event.ticket_price).toFixed(2)}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "18px",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/events/${event.id}`}
                    style={{
                      color: "#60a5fa",
                      textDecoration: "none",
                    }}
                  >
                    👁️ View
                  </Link>

                  <Link
                    href={`/promoter/events/${event.id}/edit`}
                    style={{
                      color: "#fbbf24",
                      textDecoration: "none",
                    }}
                  >
                    ✏️ Edit
                  </Link>

                  <Link
                    href={`/promoter/ticket-designer?event=${event.id}`}
                    style={{
                      color: "#c084fc",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    🎨 Ticket Designer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
