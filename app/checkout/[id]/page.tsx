import db from "../../lib/db";
import StripeCheckoutButton from "@/app/components/StripeCheckoutButton";

type EventRecord = {
  id: number;
  event_name: string;
  venue: string;
  event_date: string | Date;
  event_time: string;
  ticket_price: number | string;
  image_url: string | null;
};

export default async function CheckoutPage({
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "30px",
        }}
      >
        Event not found
      </main>
    );
  }

  const event = rows[0] as EventRecord;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#07111f 0%,#111827 55%,#1e1b4b 100%)",
        color: "white",
        padding: "40px 20px 80px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
          gap: "40px",
          alignItems: "start",
        }}
      >
        {/* LEFT SIDE */}
        <section>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.event_name}
              style={{
                width: "100%",
                borderRadius: "20px",
                maxHeight: "700px",
                objectFit: "cover",
                boxShadow: "0 25px 60px rgba(0,0,0,.45)",
              }}
            />
          ) : (
            <div
              style={{
                height: "550px",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg,#1e293b,#312e81)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "90px",
              }}
            >
              🎫
            </div>
          )}
        </section>

        {/* RIGHT SIDE */}
        <section
          style={{
            background: "rgba(15,23,42,.95)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: "22px",
            padding: "35px",
            boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          }}
        >
          <p
            style={{
              color: "#67e8f9",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            LaunchPad Checkout
          </p>

          <h1
            style={{
              fontSize: "42px",
              marginTop: 0,
              marginBottom: "25px",
            }}
          >
            {event.event_name}
          </h1>

          <div
            style={{
              borderTop: "1px solid #334155",
              borderBottom: "1px solid #334155",
              padding: "20px 0",
              display: "grid",
              gap: "15px",
            }}
          >
            <div>
              <strong>📍 Venue</strong>
              <br />
              {event.venue}
            </div>

            <div>
              <strong>📅 Date</strong>
              <br />
              {formatEventDate(event.event_date)}
            </div>

            <div>
              <strong>🕒 Time</strong>
              <br />
              {formatEventTime(event.event_time)}
            </div>
          </div>

          <div
            style={{
              marginTop: "25px",
              background: "#0b1220",
              padding: "25px",
              borderRadius: "16px",
              border: "1px solid #263449",
            }}
          >
            <p
              style={{
                color: "#94a3b8",
                marginBottom: "5px",
              }}
            >
              Ticket Price
            </p>

            <h2
              style={{
                color: "#67e8f9",
                fontSize: "36px",
                marginTop: 0,
                marginBottom: "25px",
              }}
            >
              ${Number(event.ticket_price).toFixed(2)}
            </h2>

            

            <label>Full Name</label>

            <input
              type="text"
              placeholder="John Smith"
              style={inputStyle}
            />

            <label>Email Address</label>

            <input
              type="email"
              placeholder="you@email.com"
              style={inputStyle}
            />

            <label>Phone Number</label>

            <input
              type="tel"
              placeholder="(555) 555-5555"
              style={inputStyle}
            />

            <div style={{ marginTop: "25px" }}>
              <StripeCheckoutButton
              eventId={Number(event.id)}
                eventName={event.event_name}
                price={Number(event.ticket_price)}
              />
            </div>

            <p
              style={{
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "13px",
                marginTop: "18px",
                lineHeight: 1.5,
              }}
            >
              Secure Stripe checkout. Your QR code ticket will be
              delivered immediately after payment.
            </p>
          </div>
        </section>
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
  if (!time) return "Time to be announced";

  const [hours, minutes] = time.split(":");

  const date = new Date();

  date.setHours(Number(hours), Number(minutes));

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginTop: "8px",
  marginBottom: "20px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#111827",
  color: "white",
  fontSize: "16px",
};