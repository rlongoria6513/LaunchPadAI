import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

type RegisterOrderRow = RowDataPacket & {
  id: number;
  event_id: number | null;
  event_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  ticket_number: string | null;
  used: number | boolean | null;
  created_at: string | Date | null;
};

type EventRegister = {
  eventId: number | null;
  eventName: string;
  orders: RegisterOrderRow[];
  checkedIn: number;
};

export default async function EventDayRegisterPage() {
  const session = await auth();

  if (!session) {
    redirect("/promoter/login");
  }

  const role = String(
    (session.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  const [rows] = await db.execute<RegisterOrderRow[]>(
    `
    SELECT
      id,
      event_id,
      event_name,
      customer_name,
      customer_email,
      ticket_number,
      used,
      created_at
    FROM orders
    WHERE LOWER(payment_status) = 'paid'
    ORDER BY event_name ASC, id ASC
    `
  );

  const registers = buildRegisters(rows);
  const totalTickets = rows.length;
  const totalCheckedIn = rows.filter((order) => Boolean(order.used)).length;

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
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/promoter"
          style={{
            color: "#93c5fd",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Command Center
        </Link>

        <header
          style={{
            margin: "26px 0 24px",
          }}
        >
          <p
            style={{
              color: "#67e8f9",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "2px",
              margin: "0 0 8px",
              textTransform: "uppercase",
            }}
          >
            Event-Day Register
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 8vw, 42px)",
              lineHeight: 1.1,
              margin: "0 0 10px",
            }}
          >
            Guest Lists
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Review paid tickets and check-in status by event.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Paid Tickets</span>
            <strong style={summaryNumberStyle}>{totalTickets}</strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Checked In</span>
            <strong style={summaryNumberStyle}>{totalCheckedIn}</strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Remaining</span>
            <strong style={summaryNumberStyle}>
              {Math.max(totalTickets - totalCheckedIn, 0)}
            </strong>
          </div>
        </section>

        {registers.length === 0 ? (
          <section style={emptyStyle}>
            No paid tickets are available for the register yet.
          </section>
        ) : (
          <div style={{ display: "grid", gap: "20px" }}>
            {registers.map((register) => (
              <section
                key={`${register.eventId || "unknown"}-${register.eventName}`}
                style={eventCardStyle}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: "0 0 5px",
                        fontSize: "24px",
                      }}
                    >
                      {register.eventName}
                    </h2>

                    <p
                      style={{
                        color: "#94a3b8",
                        margin: 0,
                      }}
                    >
                      {register.checkedIn} of {register.orders.length} checked in
                    </p>
                  </div>

                  <Link
                    href="/scanner"
                    style={{
                      background: "#06b6d4",
                      color: "#082f49",
                      padding: "11px 15px",
                      borderRadius: "9px",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    Open Scanner
                  </Link>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  {register.orders.map((order) => {
                    const checkedIn = Boolean(order.used);

                    return (
                      <article
                        key={order.id}
                        style={{
                          background: "rgba(15,23,42,0.72)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "11px",
                          padding: "14px",
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0, 1fr) minmax(120px, auto)",
                          gap: "12px",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              display: "block",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {order.customer_name ||
                              order.customer_email ||
                              "Guest customer"}
                          </strong>

                          <span
                            style={{
                              color: "#94a3b8",
                              display: "block",
                              fontSize: "13px",
                              marginTop: "3px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {order.ticket_number || "No ticket number"}
                          </span>
                        </div>

                        <span
                          style={{
                            justifySelf: "end",
                            border: "1px solid",
                            borderColor: checkedIn ? "#22c55e" : "#3b82f6",
                            background: checkedIn
                              ? "rgba(34,197,94,0.2)"
                              : "rgba(59,130,246,0.2)",
                            color: "white",
                            borderRadius: "999px",
                            padding: "7px 10px",
                            fontSize: "13px",
                            fontWeight: "bold",
                          }}
                        >
                          {checkedIn ? "Checked In" : "Not Checked In"}
                        </span>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function buildRegisters(orders: RegisterOrderRow[]) {
  const registers = new Map<string, EventRegister>();

  for (const order of orders) {
    const eventName = order.event_name || "Unknown Event";
    const key = `${order.event_id || "unknown"}:${eventName}`;
    const current =
      registers.get(key) ||
      {
        eventId: order.event_id,
        eventName,
        orders: [],
        checkedIn: 0,
      };

    current.orders.push(order);

    if (Boolean(order.used)) {
      current.checkedIn += 1;
    }

    registers.set(key, current);
  }

  return Array.from(registers.values());
}

const summaryCardStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "14px",
  padding: "18px",
  display: "grid",
  gap: "7px",
};

const summaryLabelStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
};

const summaryNumberStyle = {
  color: "white",
  fontSize: "30px",
};

const eventCardStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "16px",
  padding: "20px",
};

const emptyStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "16px",
  padding: "28px",
  color: "#cbd5e1",
  textAlign: "center" as const,
};
