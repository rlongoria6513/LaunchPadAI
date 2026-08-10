import { auth } from "@/app/auth";
import TicketDesignerClient from "./TicketDesignerClient";
import db from "@/app/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function TicketDesignerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/promoter-login");
  }

  const role = String(
    (session.user as any)?.role || ""
  ).toLowerCase();

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

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
      LIMIT 1
    `,
    [id]
  );

  if (!rows.length) {
    notFound();
  }

  const event = rows[0];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f, #111827, #312e81)",
        color: "white",
        padding: "30px 18px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                color: "#c4b5fd",
                fontWeight: "bold",
              }}
            >
              🎨 TICKET DESIGNER
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "34px",
              }}
            >
              {event.event_name}
            </h1>
          </div>

          <Link
            href="/promoter/events"
            style={{
              color: "white",
              textDecoration: "none",
              background: "#334155",
              padding: "11px 16px",
              borderRadius: "9px",
            }}
          >
            ← My Events
          </Link>
        </div>

        <TicketDesignerClient />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            marginTop: "28px",
          }}
        >
          {/* DESIGN CONTROLS */}
          <section
            style={{
              background: "#101c33",
              border: "1px solid #334155",
              borderRadius: "18px",
              padding: "24px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Customize Ticket
            </h2>

            <label style={labelStyle}>
              Ticket Color
            </label>

            <input
              type="color"
              defaultValue="#7c3aed"
              style={{
                width: "100%",
                height: "55px",
                border: "none",
                borderRadius: "8px",
              }}
            />

            <label style={labelStyle}>
              Ticket Style
            </label>

            <select style={inputStyle}>
              <option>Concert</option>
              <option>Festival</option>
              <option>VIP</option>
              <option>Club</option>
              <option>Classic</option>
            </select>

            <label style={labelStyle}>
              Header Text
            </label>

            <input
              type="text"
              defaultValue="ADMIT ONE"
              style={inputStyle}
            />

            <label style={labelStyle}>
              Custom Message
            </label>

            <textarea
              rows={4}
              placeholder="Thank you for supporting live music!"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            <button
              type="button"
              style={{
                width: "100%",
                marginTop: "22px",
                padding: "14px",
                borderRadius: "9px",
                border: "none",
                background: "#7c3aed",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              💾 Save Ticket Design
            </button>
          </section>

          {/* TICKET PREVIEW */}
          <section>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "14px",
              }}
            >
              Ticket Preview
            </h2>

            <div
              style={{
                overflow: "hidden",
                borderRadius: "18px",
                border: "2px solid #8b5cf6",
                background:
                  "linear-gradient(135deg, #312e81, #111827)",
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.35)",
              }}
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.event_name}
                  style={{
                    width: "100%",
                    height: "220px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}

              <div
                style={{
                  padding: "28px",
                }}
              >
                <div
                  style={{
                    color: "#c4b5fd",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                    fontSize: "13px",
                  }}
                >
                  🎟️ ADMIT ONE
                </div>

                <h2
                  style={{
                    fontSize: "30px",
                    margin: "12px 0",
                  }}
                >
                  {event.event_name}
                </h2>

                <p style={{ margin: "8px 0" }}>
                  📍 {event.venue}
                </p>

                <p style={{ margin: "8px 0" }}>
                  📅{" "}
                  {new Date(
                    event.event_date
                  ).toLocaleDateString()}
                </p>

                <p style={{ margin: "8px 0" }}>
                  🕒 {event.event_time}
                </p>

                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    marginTop: "20px",
                  }}
                >
                  $
                  {Number(
                    event.ticket_price
                  ).toFixed(2)}
                </p>

                <div
                  style={{
                    marginTop: "25px",
                    paddingTop: "20px",
                    borderTop:
                      "1px dashed #64748b",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      LaunchPad Tickets
                    </strong>

                    <div
                      style={{
                        color: "#94a3b8",
                        fontSize: "13px",
                        marginTop: "4px",
                      }}
                    >
                      Ticket #{event.id}-PREVIEW
                    </div>
                  </div>

                  <div
                    style={{
                      width: "85px",
                      height: "85px",
                      background: "white",
                      color: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    QR
                    <br />
                    PREVIEW
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginTop: "18px",
  marginBottom: "7px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px",
  borderRadius: "8px",
  border: "1px solid #475569",
  fontSize: "16px",
};