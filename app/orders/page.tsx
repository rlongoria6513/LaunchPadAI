import { auth } from "../auth";
import pool from "../lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { RowDataPacket } from "mysql2";

type Order = RowDataPacket & {
  id: number;
  event_id?: number | null;
  event_name?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  quantity?: number | null;
  amount_total?: number | string | null;
  total_amount?: number | string | null;
  amount?: number | string | null;
  payment_status?: string | null;
  ticket_number?: string | null;
  stripe_session_id?: string | null;
  checkout_session_id?: string | null;
  used?: number | boolean | null;
  created_at?: string | Date | null;
};

function formatMoney(order: Order) {
  const rawAmount =
    order.amount_total ??
    order.total_amount ??
    order.amount ??
    0;

  const numericAmount = Number(rawAmount);

  if (Number.isNaN(numericAmount)) {
    return "$0.00";
  }

  /*
    Stripe normally stores amounts in cents.
    Example: 2500 becomes $25.00.
  */
  const amountInDollars = numericAmount / 100;

  return amountInDollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(date?: string | Date | null) {
  if (!date) {
    return "Not available";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortenId(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(0, 12)}...${value.slice(-8)}`;
}

function getPaymentStatus(status?: string | null) {
  return status?.toLowerCase() || "unknown";
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const [rows] = await pool.query<Order[]>(`
    SELECT *
    FROM orders
    ORDER BY id DESC
  `);

  const orders = rows;

  const totalOrders = orders.length;

  const paidOrders = orders.filter(
    (order) => getPaymentStatus(order.payment_status) === "paid"
  ).length;

  const usedTickets = orders.filter(
    (order) => Boolean(order.used)
  ).length;

  const totalTickets = orders.reduce(
    (total, order) => total + Number(order.quantity || 1),
    0
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 55%, #1e1b4b 100%)",
        color: "white",
        padding: "35px 20px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1250px",
          margin: "0 auto",
        }}
      >
        <div
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
                color: "#a5b4fc",
                fontSize: "14px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "2px",
                margin: "0 0 8px",
              }}
            >
              Back Office
            </p>

            <h1
              style={{
                fontSize: "38px",
                margin: "0 0 10px",
              }}
            >
              🧾 Orders & Tickets
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: "16px",
                margin: 0,
              }}
            >
              Review customer orders, payments, ticket numbers, and check-in
              status.
            </p>
          </div>

          <Link
            href="/admin"
            style={{
              display: "inline-block",
              background: "#4f46e5",
              color: "white",
              padding: "12px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Back to Admin Panel
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Total Orders</span>
            <strong style={summaryNumberStyle}>{totalOrders}</strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Paid Orders</span>
            <strong style={summaryNumberStyle}>{paidOrders}</strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Tickets Sold</span>
            <strong style={summaryNumberStyle}>{totalTickets}</strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Tickets Used</span>
            <strong style={summaryNumberStyle}>{usedTickets}</strong>
          </div>
        </div>

        {orders.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "40px",
              textAlign: "center",
              color: "#cbd5e1",
            }}
          >
            <h2 style={{ color: "white", marginTop: 0 }}>
              No orders found
            </h2>

            <p style={{ marginBottom: 0 }}>
              Completed customer orders will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {orders.map((order) => {
              const paymentStatus = getPaymentStatus(order.payment_status);
              const ticketUsed = Boolean(order.used);

              const stripeId =
                order.stripe_session_id ||
                order.checkout_session_id ||
                null;

              return (
                <article
                  key={order.id}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "16px",
                    padding: "22px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "#a5b4fc",
                          fontSize: "13px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          margin: "0 0 6px",
                        }}
                      >
                        Order #{order.id}
                      </p>

                      <h2
                        style={{
                          fontSize: "23px",
                          margin: "0 0 5px",
                        }}
                      >
                        {order.event_name || "Event Ticket Order"}
                      </h2>

                      <p
                        style={{
                          color: "#94a3b8",
                          margin: 0,
                          fontSize: "14px",
                        }}
                      >
                        Created {formatDate(order.created_at)}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          ...statusBadgeStyle,
                          background:
                            paymentStatus === "paid"
                              ? "rgba(22,163,74,0.25)"
                              : paymentStatus === "pending"
                              ? "rgba(234,179,8,0.25)"
                              : "rgba(220,38,38,0.25)",
                          borderColor:
                            paymentStatus === "paid"
                              ? "#22c55e"
                              : paymentStatus === "pending"
                              ? "#eab308"
                              : "#ef4444",
                        }}
                      >
                        {paymentStatus === "paid"
                          ? "✓ Paid"
                          : paymentStatus === "pending"
                          ? "Pending"
                          : paymentStatus}
                      </span>

                      <span
                        style={{
                          ...statusBadgeStyle,
                          background: ticketUsed
                            ? "rgba(220,38,38,0.25)"
                            : "rgba(37,99,235,0.25)",
                          borderColor: ticketUsed ? "#ef4444" : "#3b82f6",
                        }}
                      >
                        {ticketUsed ? "Ticket Used" : "Ticket Available"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(210px, 1fr))",
                      gap: "15px",
                    }}
                  >
                    <div style={detailBoxStyle}>
                      <span style={detailLabelStyle}>Customer</span>
                      <strong>
                        {order.customer_name ||
                          order.customer_email ||
                          "Guest customer"}
                      </strong>

                      {order.customer_name && order.customer_email && (
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "13px",
                            marginTop: "4px",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {order.customer_email}
                        </span>
                      )}
                    </div>

                    <div style={detailBoxStyle}>
                      <span style={detailLabelStyle}>Ticket Number</span>
                      <strong
                        style={{
                          overflowWrap: "anywhere",
                        }}
                      >
                        {order.ticket_number || "Not assigned"}
                      </strong>
                    </div>

                    <div style={detailBoxStyle}>
                      <span style={detailLabelStyle}>Quantity</span>
                      <strong>{Number(order.quantity || 1)}</strong>
                    </div>

                    <div style={detailBoxStyle}>
                      <span style={detailLabelStyle}>Amount</span>
                      <strong>{formatMoney(order)}</strong>
                    </div>

                    <div style={detailBoxStyle}>
                      <span style={detailLabelStyle}>Stripe Checkout ID</span>

                      <strong
                        title={stripeId || undefined}
                        style={{
                          fontFamily: "monospace",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {shortenId(stripeId)}
                      </strong>
                    </div>

                    <div style={detailBoxStyle}>
                      <span style={detailLabelStyle}>Event ID</span>
                      <strong>{order.event_id || "Not available"}</strong>
                    </div>
                  </div>
                <div
  style={{
    marginTop: "18px",
    display: "flex",
    justifyContent: "flex-end",
  }}
>
  <Link
    href={`/admin/orders/${order.id}`}
    style={{
      display: "inline-block",
      background: "#4f46e5",
      color: "white",
      padding: "11px 16px",
      borderRadius: "9px",
      textDecoration: "none",
      fontWeight: "bold",
    }}
  >
    View Order Details →
  </Link>
</div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const summaryCardStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "14px",
  padding: "20px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const summaryLabelStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
};

const summaryNumberStyle = {
  color: "white",
  fontSize: "30px",
};

const statusBadgeStyle = {
  display: "inline-block",
  border: "1px solid",
  color: "white",
  padding: "7px 11px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "bold",
};

const detailBoxStyle = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "14px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
  minWidth: 0,
};

const detailLabelStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};