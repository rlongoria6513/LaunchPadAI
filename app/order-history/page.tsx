import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

type SessionUser = {
  role?: unknown;
};

type OrderRow = RowDataPacket & {
  id: number;
  event_name: string | null;
  quantity: number | string | null;
  amount_paid: number | string | null;
  service_fee: number | string | null;
  total_charged: number | string | null;
  payment_status: string | null;
  ticket_number: string | null;
  created_at: string | Date | null;
};

export default async function OrderHistoryPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const role = String(
    (session.user as SessionUser | undefined)?.role || ""
  ).toLowerCase();

  if (role !== "customer") {
    redirect("/dashboard");
  }

  const [orders] = await db.execute<OrderRow[]>(
    `
    SELECT
      id,
      event_name,
      quantity,
      amount_paid,
      service_fee,
      total_charged,
      payment_status,
      ticket_number,
      created_at
    FROM orders
    WHERE customer_email = ?
    ORDER BY created_at DESC
    `,
    [session.user.email]
  );

  return (
    <main className="orders-page">
      <style>{`
        .orders-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.2), transparent 34%),
            linear-gradient(135deg, #07111f 0%, #111827 55%, #172554 100%);
          color: white;
          font-family: Arial, sans-serif;
          padding: 42px 20px 72px;
        }

        .orders-shell {
          margin: 0 auto;
          max-width: 1040px;
          width: 100%;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }

        .orders-header h1 {
          font-size: clamp(32px, 8vw, 42px);
          line-height: 1.08;
          margin: 0 0 8px;
        }

        .orders-header p {
          color: #cbd5e1;
          margin: 0;
          overflow-wrap: anywhere;
        }

        .orders-link {
          background: #2563eb;
          border-radius: 11px;
          color: white;
          display: inline-block;
          font-weight: 800;
          padding: 12px 16px;
          text-align: center;
          text-decoration: none;
        }

        .orders-list {
          display: grid;
          gap: 16px;
        }

        .order-card,
        .orders-empty {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.26);
          border-radius: 16px;
          padding: 20px;
        }

        .order-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .order-card h2 {
          font-size: 23px;
          margin: 0 0 6px;
          overflow-wrap: anywhere;
        }

        .order-card small {
          color: #94a3b8;
        }

        .order-status {
          border: 1px solid #22c55e;
          border-radius: 999px;
          color: #bbf7d0;
          font-size: 12px;
          font-weight: 800;
          padding: 7px 10px;
          text-transform: uppercase;
        }

        .order-status.pending {
          border-color: #eab308;
          color: #fef3c7;
        }

        .order-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .order-detail {
          background: rgba(2, 6, 23, 0.45);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 11px;
          padding: 12px;
          min-width: 0;
        }

        .order-detail span {
          color: #94a3b8;
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .order-detail strong {
          color: #f8fafc;
          overflow-wrap: anywhere;
        }

        .orders-empty {
          color: #cbd5e1;
          text-align: center;
        }

        @media (max-width: 760px) {
          .orders-page {
            padding: 30px 12px 56px;
          }

          .orders-link {
            width: 100%;
          }

          .order-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="orders-shell">
        <header className="orders-header">
          <div>
            <h1>Order History</h1>
            <p>Signed in as {session.user.email}</p>
          </div>

          <Link href="/my-tickets" className="orders-link">
            My Tickets
          </Link>
        </header>

        {orders.length === 0 ? (
          <section className="orders-empty">
            <h2>No orders yet</h2>
            <p>Your completed LaunchPad orders will appear here.</p>
            <Link href="/events" className="orders-link">
              Browse Events
            </Link>
          </section>
        ) : (
          <section className="orders-list" aria-label="Customer orders">
            {orders.map((order) => {
              const status = String(
                order.payment_status || "processing"
              ).toLowerCase();

              return (
                <article className="order-card" key={order.id}>
                  <div className="order-card-top">
                    <div>
                      <h2>{order.event_name || "LaunchPad Event"}</h2>
                      <small>Order #{order.id} · {formatDate(order.created_at)}</small>
                    </div>

                    <span
                      className={`order-status ${
                        status === "paid" ? "" : "pending"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="order-grid">
                    <OrderDetail
                      label="Ticket"
                      value={order.ticket_number || "Pending"}
                    />
                    <OrderDetail
                      label="Quantity"
                      value={Number(order.quantity || 1)}
                    />
                    <OrderDetail
                      label="Ticket Price"
                      value={formatMoney(order.amount_paid)}
                    />
                    <OrderDetail
                      label="Total Charged"
                      value={formatMoney(
                        order.total_charged ?? order.amount_paid
                      )}
                    />
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function OrderDetail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="order-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(amountValue: number | string | null) {
  const amount = Number(amountValue || 0);

  if (!Number.isFinite(amount)) {
    return "$0.00";
  }

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
