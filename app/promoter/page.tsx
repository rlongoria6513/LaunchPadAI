import Link from "next/link";
import { auth } from "@/app/auth";
import pool from "@/app/lib/db";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

type OrderRow = RowDataPacket & {
  id: number;
  event_name?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  quantity?: number | string | null;
  amount_total?: number | string | null;
  total_amount?: number | string | null;
  amount?: number | string | null;
  payment_status?: string | null;
  ticket_number?: string | null;
  used?: number | boolean | null;
  created_at?: string | Date | null;
};

function getOrderQuantity(order: OrderRow) {
  const quantity = Number(order.quantity || 1);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return quantity;
}

function getOrderAmount(order: OrderRow) {
  const rawAmount =
    order.amount_total ??
    order.total_amount ??
    order.amount ??
    0;

  const amount = Number(rawAmount);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return amount;
}

function formatMoney(amountInCents: number) {
  return (amountInCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(date?: string | Date | null) {
  if (!date) {
    return "No date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No date";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PromoterPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  const [rows] = await pool.query<OrderRow[]>(`
    SELECT *
    FROM orders
    ORDER BY id DESC
  `);

  const orders = rows;

  const paidOrders = orders.filter(
    (order) => order.payment_status?.toLowerCase() === "paid"
  );

  const ticketsSold = paidOrders.reduce(
    (total, order) => total + getOrderQuantity(order),
    0
  );

  const totalRevenue = paidOrders.reduce(
    (total, order) => total + getOrderAmount(order),
    0
  );

  const guestsCheckedIn = paidOrders.filter((order) =>
    Boolean(order.used)
  ).length;

  const guestsRemaining = Math.max(
    ticketsSold - guestsCheckedIn,
    0
  );

  const checkInPercentage =
    ticketsSold > 0
      ? Math.round((guestsCheckedIn / ticketsSold) * 100)
      : 0;

  const recentOrders = orders.slice(0, 6);

  const userName =
    session.user?.name ||
    session.user?.email ||
    "Promoter";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 52%, #1e1b4b 100%)",
        color: "white",
        padding: "38px 20px 70px",
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
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
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
              Live Event Operations
            </p>

            <h1
              style={{
                fontSize: "40px",
                margin: "0 0 10px",
              }}
            >
              ⚡ Live Event Command Center
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: "17px",
                margin: 0,
              }}
            >
              Welcome, {userName}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {role === "admin" && (
              <Link
                href="/admin"
                style={secondaryButtonStyle}
              >
                ← Admin Panel
              </Link>
            )}

            <Link
              href="/scanner"
              style={primaryButtonStyle}
            >
              📷 Open Scanner
            </Link>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div style={metricCardStyle}>
            <div style={metricIconStyle}>🎟️</div>
            <span style={metricLabelStyle}>Tickets Sold</span>
            <strong style={metricNumberStyle}>
              {ticketsSold}
            </strong>
            <span style={metricHelpStyle}>
              Paid ticket quantity
            </span>
          </div>

          <div style={metricCardStyle}>
            <div style={metricIconStyle}>💰</div>
            <span style={metricLabelStyle}>Revenue</span>
            <strong style={metricNumberStyle}>
              {formatMoney(totalRevenue)}
            </strong>
            <span style={metricHelpStyle}>
              Completed payments
            </span>
          </div>

          <div style={metricCardStyle}>
            <div style={metricIconStyle}>✅</div>
            <span style={metricLabelStyle}>Checked In</span>
            <strong style={metricNumberStyle}>
              {guestsCheckedIn}
            </strong>
            <span style={metricHelpStyle}>
              Tickets already scanned
            </span>
          </div>

          <div style={metricCardStyle}>
            <div style={metricIconStyle}>⏳</div>
            <span style={metricLabelStyle}>Remaining</span>
            <strong style={metricNumberStyle}>
              {guestsRemaining}
            </strong>
            <span style={metricHelpStyle}>
              Guests not checked in
            </span>
          </div>
        </section>

        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.28), rgba(79,70,229,0.3))",
            border: "1px solid rgba(56,189,248,0.55)",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "25px",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  color: "#bae6fd",
                  fontSize: "13px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  margin: "0 0 8px",
                }}
              >
                Guest Check-In Progress
              </p>

              <h2
                style={{
                  fontSize: "29px",
                  margin: "0 0 10px",
                }}
              >
                {checkInPercentage}% Checked In
              </h2>

              <p
                style={{
                  color: "#dbeafe",
                  lineHeight: "1.6",
                  margin: "0 0 18px",
                }}
              >
                {guestsCheckedIn} of {ticketsSold} paid tickets
                have been scanned.
              </p>

              <div
                style={{
                  width: "100%",
                  height: "14px",
                  background: "rgba(15,23,42,0.7)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${checkInPercentage}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #06b6d4, #22c55e)",
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: "rgba(15,23,42,0.7)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "16px",
                padding: "22px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: "21px",
                }}
              >
                📷 Scan Guest Tickets
              </h3>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: "1.5",
                  margin: "0 0 18px",
                }}
              >
                Open the scanner on a phone and validate each
                guest&apos;s QR code at the entrance.
              </p>

              <Link
                href="/scanner"
                style={{
                  display: "block",
                  background: "#06b6d4",
                  color: "#082f49",
                  padding: "15px 20px",
                  borderRadius: "11px",
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: "17px",
                  fontWeight: "bold",
                }}
              >
                Open Ticket Scanner
              </Link>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "22px",
            marginBottom: "28px",
          }}
        >
          <section
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "18px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 5px",
                    fontSize: "24px",
                  }}
                >
                  Recent Ticket Activity
                </h2>

                <p
                  style={{
                    color: "#94a3b8",
                    margin: 0,
                    fontSize: "14px",
                  }}
                >
                  Latest purchases and ticket activity
                </p>
              </div>

              <span
                style={{
                  background: "rgba(34,197,94,0.18)",
                  border: "1px solid rgba(34,197,94,0.5)",
                  color: "#bbf7d0",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                ● LIVE
              </span>
            </div>

            {recentOrders.length === 0 ? (
              <p
                style={{
                  color: "#94a3b8",
                  marginBottom: 0,
                }}
              >
                No ticket activity yet.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "11px",
                }}
              >
                {recentOrders.map((order) => {
                  const ticketUsed = Boolean(order.used);
                  const customer =
                    order.customer_name ||
                    order.customer_email ||
                    "Guest customer";

                  return (
                    <div
                      key={order.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "14px",
                        background: "rgba(15,23,42,0.6)",
                        borderRadius: "11px",
                        padding: "13px",
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {ticketUsed ? "✅" : "🎟️"} {customer}
                        </strong>

                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "13px",
                          }}
                        >
                          {order.event_name || "Event ticket"}
                        </span>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            color: ticketUsed
                              ? "#86efac"
                              : "#93c5fd",
                            fontSize: "13px",
                          }}
                        >
                          {ticketUsed
                            ? "Checked In"
                            : "Purchased"}
                        </strong>

                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                          }}
                        >
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "18px",
              padding: "24px",
            }}
          >
            <h2
              style={{
                margin: "0 0 5px",
                fontSize: "24px",
              }}
            >
              Command Center Tools
            </h2>

            <p
              style={{
                color: "#94a3b8",
                margin: "0 0 18px",
                fontSize: "14px",
              }}
            >
              Manage events and door operations
            </p>

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              <Link
                href="/create-event"
                style={commandToolStyle}
              >
                <span style={commandToolIconStyle}>➕</span>

                <span>
                  <strong style={commandToolTitleStyle}>
                    Create Event
                  </strong>

                  <small style={commandToolTextStyle}>
                    Publish a new event
                  </small>
                </span>
              </Link>

              <Link
                href="/promoter/events"
                style={commandToolStyle}
              >
                <span style={commandToolIconStyle}>🎟️</span>

                <span>
                  <strong style={commandToolTitleStyle}>
                    Manage Events
                  </strong>

                  <small style={commandToolTextStyle}>
                    View and edit listings
                  </small>
                </span>
              </Link>

              <Link
                href="/scanner"
                style={commandToolStyle}
              >
                <span style={commandToolIconStyle}>✅</span>

                <span>
                  <strong style={commandToolTitleStyle}>
                    Check-In Scanner
                  </strong>

                  <small style={commandToolTextStyle}>
                    Scan and validate tickets
                  </small>
                </span>
              </Link>
            </div>
          </section>
        </div>

        <div
          style={{
            padding: "18px 20px",
            background: "rgba(99,102,241,0.14)",
            border: "1px solid rgba(129,140,248,0.3)",
            borderRadius: "14px",
            color: "#cbd5e1",
          }}
        >
          <strong style={{ color: "white" }}>
            Command center account:
          </strong>{" "}
          {session.user?.email}
        </div>
      </div>
    </main>
  );
}

const metricCardStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "16px",
  padding: "21px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};

const metricIconStyle = {
  fontSize: "30px",
};

const metricLabelStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
  fontWeight: "bold",
};

const metricNumberStyle = {
  color: "white",
  fontSize: "31px",
};

const metricHelpStyle = {
  color: "#94a3b8",
  fontSize: "12px",
};

const primaryButtonStyle = {
  background: "#06b6d4",
  color: "#082f49",
  padding: "12px 18px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  background: "#4f46e5",
  color: "white",
  padding: "12px 18px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
};

const commandToolStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  padding: "15px",
  color: "white",
  textDecoration: "none",
};

const commandToolIconStyle = {
  fontSize: "28px",
};

const commandToolTitleStyle = {
  display: "block",
  marginBottom: "4px",
};

const commandToolTextStyle = {
  display: "block",
  color: "#94a3b8",
};