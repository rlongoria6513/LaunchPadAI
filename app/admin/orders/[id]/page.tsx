import { auth } from "../../../auth";
import pool from "../../../lib/db";
import { redirect, notFound } from "next/navigation";
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

type PageProps = {
  params: Promise<{
    id: string;
  }>;
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

  return (numericAmount / 100).toLocaleString("en-US", {
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
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailsPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    notFound();
  }

  const [rows] = await pool.query<Order[]>(
    `
      SELECT *
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
    [orderId]
  );

  const order = rows[0];

  if (!order) {
    notFound();
  }

  const paymentStatus =
    order.payment_status?.toLowerCase() || "unknown";

  const ticketUsed = Boolean(order.used);

  const stripeId =
    order.stripe_session_id ||
    order.checkout_session_id ||
    "Not available";

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
          maxWidth: "1000px",
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
            marginBottom: "28px",
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
              Order Record
            </p>

            <h1
              style={{
                fontSize: "38px",
                margin: "0 0 8px",
              }}
            >
              🎟️ Order #{order.id}
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                margin: 0,
              }}
            >
              Complete customer, payment, and ticket information
            </p>
          </div>

          <Link
            href="/admin/orders"
            style={{
              background: "#4f46e5",
              color: "white",
              padding: "12px 18px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Back to Orders
          </Link>
        </div>

        <section
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "22px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "18px",
              marginBottom: "22px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#94a3b8",
                  margin: "0 0 6px",
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "bold",
                }}
              >
                Event
              </p>

              <h2
                style={{
                  margin: 0,
                  fontSize: "26px",
                }}
              >
                {order.event_name || "Event Ticket Order"}
              </h2>
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
                  ...badgeStyle,
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
                  : paymentStatus}
              </span>

              <span
                style={{
                  ...badgeStyle,
                  background: ticketUsed
                    ? "rgba(220,38,38,0.25)"
                    : "rgba(37,99,235,0.25)",
                  borderColor: ticketUsed ? "#ef4444" : "#3b82f6",
                }}
              >
                {ticketUsed
                  ? "Ticket Used"
                  : "Ticket Available"}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Customer Name</span>
              <strong>
                {order.customer_name || "Guest customer"}
              </strong>
            </div>

            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Customer Email</span>
              <strong
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                {order.customer_email || "Not available"}
              </strong>
            </div>

            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Ticket Number</span>
              <strong
                style={{
                  overflowWrap: "anywhere",
                }}
              >
                {order.ticket_number || "Not assigned"}
              </strong>
            </div>

            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Quantity</span>
              <strong>{Number(order.quantity || 1)}</strong>
            </div>

            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Total Amount</span>
              <strong>{formatMoney(order)}</strong>
            </div>

            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Purchase Date</span>
              <strong>{formatDate(order.created_at)}</strong>
            </div>

            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Event ID</span>
              <strong>{order.event_id || "Not available"}</strong>
            </div>

            <div style={detailCardStyle}>
              <span style={detailLabelStyle}>Order ID</span>
              <strong>{order.id}</strong>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "22px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "22px",
            }}
          >
            Payment Information
          </h2>

          <div style={detailCardStyle}>
            <span style={detailLabelStyle}>
              Stripe Checkout Session
            </span>

            <code
              style={{
                color: "#e2e8f0",
                fontSize: "14px",
                overflowWrap: "anywhere",
                whiteSpace: "normal",
              }}
            >
              {stripeId}
            </code>
          </div>
        </section>

        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(79,70,229,0.3), rgba(14,165,233,0.2))",
            border: "1px solid rgba(129,140,248,0.45)",
            borderRadius: "18px",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#c7d2fe",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontSize: "13px",
              fontWeight: "bold",
              margin: "0 0 10px",
            }}
          >
            LaunchPad AI Ticket
          </p>

          <h2
            style={{
              fontSize: "28px",
              margin: "0 0 10px",
            }}
          >
            {order.event_name || "Event Ticket"}
          </h2>

          <p
            style={{
              fontSize: "18px",
              margin: "0 0 8px",
            }}
          >
            Ticket #{order.ticket_number || "Not assigned"}
          </p>

          <p
            style={{
              color: "#cbd5e1",
              margin: 0,
            }}
          >
            {ticketUsed
              ? "This ticket has already been checked in."
              : "This ticket is valid and available for check-in."}
          </p>
        </section>
      </div>
    </main>
  );
}

const badgeStyle = {
  display: "inline-block",
  border: "1px solid",
  color: "white",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "bold",
};

const detailCardStyle = {
  background: "rgba(15,23,42,0.65)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "11px",
  padding: "15px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
  minWidth: 0,
};

const detailLabelStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "0.8px",
};