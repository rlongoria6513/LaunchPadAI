import { auth } from "@/app/auth";
import TicketDesignerClient from "./TicketDesignerClient";
import db from "@/app/lib/db";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  venue: string;
  location: string;
  event_date: string | Date;
  event_time: string;
  image_url: string | null;
  ticket_template: string | object | null;
  promoter_id: number | null;
};

export default async function TicketDesigner({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
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
  const membership=await getMembershipStatus(userId,role); if(!membership.allowed)redirect("/promoter/membership?required=1");

  const params = await searchParams;
  const eventId = Number(params.event || 1);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    redirect("/promoter/events");
  }

  const [rows] = await db.execute<EventRow[]>(
    `
    SELECT
      id,
      event_name,
      venue,
      location,
      event_date,
      event_time,
      image_url,
      ticket_template,
      promoter_id
    FROM events
    WHERE id = ?
      AND (? = 'admin' OR promoter_id = ?)
    LIMIT 1
    `,
    [eventId, role, userId]
  );

  const event = rows[0];

  if (!event) {
    return (
      <main
        style={{
          background: "#111827",
          color: "white",
          minHeight: "100vh",
          padding: 40,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Event not found</h1>
      </main>
    );
  }

  let initialTemplate = {};

  if (
    event.ticket_template &&
    typeof event.ticket_template === "object"
  ) {
    initialTemplate = event.ticket_template;
  }

  if (
    event.ticket_template &&
    typeof event.ticket_template === "string"
  ) {
    try {
      initialTemplate = JSON.parse(event.ticket_template);
    } catch (error) {
      console.error("Ticket template JSON error:", error);
      initialTemplate = {};
    }
  }

  const formattedDate = new Date(
    event.event_date
  ).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = new Date(
    `1970-01-01T${event.event_time}`
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <main
      style={{
        background: "#111827",
        color: "white",
        minHeight: "100vh",
        padding: 40,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 40,
          marginBottom: 8,
        }}
      >
        🎟️ {event.event_name}
      </h1>

      <p
        style={{
          color: "#9ca3af",
          marginBottom: 40,
        }}
      >
        Design professional digital tickets for your events.
      </p>

      <div
        style={{
          background: "#1f2937",
          borderRadius: 18,
          padding: 30,
          border: "1px solid #374151",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: 30,
          }}
        >
          Ticket Preview
        </h2>

        <TicketDesignerClient
          eventId={eventId}
          event={{
            event_name: event.event_name,
            venue: event.venue,
            location: event.location,
            event_date: String(event.event_date),
            event_time: event.event_time,
            image_url: event.image_url || undefined,
          }}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
          initialTemplate={initialTemplate}
        />
      </div>
    </main>
  );
}
