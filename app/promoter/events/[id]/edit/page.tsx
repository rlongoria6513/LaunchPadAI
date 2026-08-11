import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import EditEventForm from "./EditEventForm";
import type { RowDataPacket } from "mysql2";

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  venue: string;
  event_date: string | Date;
  event_time: string;
  ticket_price: number | string;
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/promoter/login");
  }

  const role = String(
    (session.user as { role?: unknown })?.role || ""
  ).toLowerCase();
  const userId = Number((session.user as { id?: unknown })?.id || 0);

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    redirect("/promoter/events");
  }

  const [rows] = await db.execute<EventRow[]>(
    `
    SELECT
      id,
      event_name,
      venue,
      event_date,
      event_time,
      ticket_price
    FROM events
    WHERE id = ?
      AND (? = 'admin' OR promoter_id = ?)
    LIMIT 1
    `,
    [eventId, role, userId]
  );

  if (!rows.length) {
    redirect("/promoter/events");
  }

  const event = rows[0];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/promoter/events"
          style={{
            color: "#93c5fd",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to My Events
        </Link>

        <h1
          style={{
            fontSize: "clamp(28px, 8vw, 40px)",
            lineHeight: 1.15,
            margin: "26px 0 10px",
          }}
        >
          Edit Event
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            margin: "0 0 24px",
          }}
        >
          Update the public listing details for this event.
        </p>

        <EditEventForm
          eventId={event.id}
          eventName={event.event_name}
          venue={event.venue}
          eventDate={formatDateInputValue(event.event_date)}
          eventTime={formatTimeInputValue(event.event_time)}
          ticketPrice={Number(event.ticket_price).toFixed(2)}
        />
      </div>
    </main>
  );
}

function formatDateInputValue(date: string | Date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatTimeInputValue(time: string) {
  return String(time || "").slice(0, 5);
}
