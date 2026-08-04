import TicketDesignerClient from "./TicketDesignerClient";
import db from "@/app/lib/db";

export default async function TicketDesigner({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const params = await searchParams;
  const eventId = Number(params.event || 1);

  const [rows]: any = await db.execute(
    `
    SELECT
      event_name,
      venue,
      location,
      event_date,
      event_time,
      image_url,
      ticket_template
    FROM events
    WHERE id = ?
    `,
    [eventId]
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
          event={event}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
          initialTemplate={initialTemplate}
        />
      </div>
    </main>
  );
}