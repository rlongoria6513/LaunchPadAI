import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { generateQRCode } from "@/app/lib/qrcode";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

type TicketRow = RowDataPacket & {
  id: number;
  event_name: string | null;
  image_url: string | null;
  venue: string | null;
  event_date: string | Date | null;
  event_time: string | null;
  ticket_number: string | null;
  quantity: number | string | null;
  amount_paid: number | string | null;
  payment_status: string | null;
  used: number | boolean | null;
  created_at: string | Date | null;
};

export default async function MyTicketsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const [rows] = await db.execute<TicketRow[]>(
    `
    SELECT
      orders.id,
      orders.event_name,
      events.image_url,
      events.venue,
      events.event_date,
      events.event_time,
      orders.ticket_number,
      orders.quantity,
      orders.amount_paid,
      orders.payment_status,
      orders.used,
      orders.created_at
    FROM orders
    LEFT JOIN events ON orders.event_id = events.id
    WHERE orders.customer_email = ?
    ORDER BY orders.created_at DESC
    `,
    [session.user.email]
  );

  const tickets = await Promise.all(
    rows.map(async (ticket) => ({
      ...ticket,
      qrCode: ticket.ticket_number
        ? await generateQRCode(ticket.ticket_number)
        : null,
    }))
  );

  return (
    <main className="tickets-page">
      <style>{`
        .tickets-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 34%),
            linear-gradient(135deg, #07111f 0%, #111827 52%, #172554 100%);
          color: white;
          padding: 42px 20px 72px;
          font-family: Arial, sans-serif;
        }

        .tickets-shell {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        .tickets-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin-bottom: 28px;
        }

        .tickets-eyebrow {
          color: #67e8f9;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 0 0 8px;
          text-transform: uppercase;
        }

        .tickets-title {
          font-size: 42px;
          line-height: 1.08;
          margin: 0;
        }

        .tickets-account {
          color: #cbd5e1;
          font-size: 14px;
          margin: 8px 0 0;
          overflow-wrap: anywhere;
        }

        .tickets-count {
          background: rgba(15, 23, 42, 0.76);
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 999px;
          color: #dbeafe;
          font-size: 14px;
          font-weight: 800;
          padding: 10px 14px;
          white-space: nowrap;
        }

        .tickets-actions {
          align-items: flex-end;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tickets-browse-link {
          background: #06b6d4;
          border-radius: 11px;
          color: #082f49;
          display: inline-flex;
          font-size: 15px;
          font-weight: 800;
          justify-content: center;
          padding: 12px 16px;
          text-decoration: none;
          white-space: nowrap;
        }

        .tickets-empty {
          background: rgba(15, 23, 42, 0.82);
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 18px;
          color: #cbd5e1;
          padding: 34px;
          text-align: center;
        }

        .tickets-empty p {
          line-height: 1.55;
          margin-bottom: 22px;
        }

        .tickets-grid {
          display: grid;
          gap: 22px;
        }

        .ticket-card {
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.26);
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
          display: grid;
          grid-template-columns: minmax(220px, 34%) minmax(0, 1fr) minmax(180px, 220px);
          overflow: hidden;
          min-height: 290px;
        }

        .ticket-flyer {
          background: linear-gradient(135deg, #1e293b, #1d4ed8);
          min-height: 100%;
        }

        .ticket-flyer img {
          width: 100%;
          height: 100%;
          min-height: 290px;
          object-fit: cover;
          display: block;
        }

        .ticket-flyer-placeholder {
          min-height: 290px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #bfdbfe;
          font-size: 64px;
          font-weight: 800;
        }

        .ticket-body {
          padding: 26px;
          min-width: 0;
        }

        .ticket-status-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }

        .ticket-status,
        .payment-status {
          border: 1px solid;
          border-radius: 999px;
          color: white;
          display: inline-block;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.6px;
          padding: 7px 10px;
          text-transform: uppercase;
        }

        .ticket-status.ready {
          background: rgba(22, 163, 74, 0.18);
          border-color: #22c55e;
        }

        .ticket-status.used {
          background: rgba(220, 38, 38, 0.2);
          border-color: #ef4444;
        }

        .ticket-status.processing {
          background: rgba(234, 179, 8, 0.18);
          border-color: #eab308;
        }

        .payment-status {
          background: rgba(37, 99, 235, 0.18);
          border-color: #60a5fa;
        }

        .ticket-event-name {
          color: #f8fafc;
          font-size: 30px;
          line-height: 1.13;
          margin: 0 0 18px;
          overflow-wrap: anywhere;
        }

        .ticket-details {
          border-top: 1px solid rgba(148, 163, 184, 0.22);
          display: grid;
          gap: 13px;
          padding-top: 18px;
        }

        .ticket-detail {
          display: grid;
          gap: 4px;
        }

        .ticket-detail span {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .ticket-detail strong {
          color: #e2e8f0;
          font-size: 16px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .ticket-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .ticket-meta {
          background: rgba(2, 6, 23, 0.42);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 12px;
          padding: 12px;
        }

        .ticket-meta span {
          color: #94a3b8;
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.8px;
          margin-bottom: 5px;
          text-transform: uppercase;
        }

        .ticket-meta strong {
          color: #f8fafc;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .ticket-qr-panel {
          background: rgba(2, 6, 23, 0.45);
          border-left: 1px dashed rgba(148, 163, 184, 0.32);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 18px;
          text-align: center;
        }

        .ticket-qr-label {
          color: #67e8f9;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.8px;
          margin: 0;
          text-transform: uppercase;
        }

        .ticket-qr-image {
          width: 168px;
          height: 168px;
          background: white;
          border-radius: 14px;
          display: block;
          padding: 10px;
        }

        .ticket-qr-missing {
          width: 168px;
          height: 168px;
          align-items: center;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 14px;
          color: #cbd5e1;
          display: flex;
          font-size: 14px;
          justify-content: center;
          padding: 18px;
        }

        .ticket-scan-note {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.45;
          margin: 0;
        }

        @media (max-width: 900px) {
          .ticket-card {
            grid-template-columns: minmax(180px, 36%) minmax(0, 1fr);
          }

          .ticket-qr-panel {
            border-left: 0;
            border-top: 1px dashed rgba(148, 163, 184, 0.32);
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 640px) {
          .tickets-page {
            padding: 28px 12px 54px;
          }

          .tickets-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .tickets-title {
            font-size: 34px;
          }

          .tickets-count {
            white-space: normal;
          }

          .tickets-actions {
            align-items: stretch;
            width: 100%;
          }

          .tickets-browse-link {
            width: 100%;
          }

          .ticket-card {
            border-radius: 15px;
            grid-template-columns: 1fr;
          }

          .ticket-flyer img,
          .ticket-flyer-placeholder {
            min-height: 230px;
            max-height: 300px;
          }

          .ticket-body {
            padding: 22px 16px;
          }

          .ticket-event-name {
            font-size: 25px;
          }

          .ticket-meta-grid {
            grid-template-columns: 1fr;
          }

          .ticket-qr-panel {
            padding: 22px 16px 24px;
          }

          .ticket-qr-image,
          .ticket-qr-missing {
            width: 190px;
            height: 190px;
          }
        }
      `}</style>

      <div className="tickets-shell">
        <header className="tickets-header">
          <div>
            <p className="tickets-eyebrow">Digital Ticket Wallet</p>
            <h1 className="tickets-title">My Tickets</h1>
            <p className="tickets-account">
              Signed in as {session.user.email}
            </p>
          </div>

          <div className="tickets-actions">
            <div className="tickets-count">
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
            </div>

            <Link href="/events" className="tickets-browse-link">
              Browse Events
            </Link>
          </div>
        </header>

        {tickets.length === 0 ? (
          <div className="tickets-empty">
            <h2>No tickets yet</h2>
            <p>
              Tickets you purchase on LaunchPad will appear here with
              event details and your entry QR code.
            </p>

            <Link href="/events" className="tickets-browse-link">
              Browse Events
            </Link>
          </div>
        ) : (
          <section className="tickets-grid" aria-label="Purchased tickets">
            {tickets.map((ticket) => {
              const status = getTicketStatus(ticket);

              return (
                <article className="ticket-card" key={ticket.id}>
                  <div className="ticket-flyer">
                    {ticket.image_url ? (
                      <img
                        src={ticket.image_url}
                        alt={`${ticket.event_name || "Event"} flyer`}
                      />
                    ) : (
                      <div className="ticket-flyer-placeholder">LP</div>
                    )}
                  </div>

                  <div className="ticket-body">
                    <div className="ticket-status-row">
                      <span className={`ticket-status ${status.className}`}>
                        {status.label}
                      </span>

                      <span className="payment-status">
                        Payment {formatPaymentStatus(ticket.payment_status)}
                      </span>
                    </div>

                    <h2 className="ticket-event-name">
                      {ticket.event_name || "LaunchPad Event"}
                    </h2>

                    <div className="ticket-details">
                      <div className="ticket-detail">
                        <span>Date and time</span>
                        <strong>
                          {formatEventDate(ticket.event_date)} at{" "}
                          {formatEventTime(ticket.event_time)}
                        </strong>
                      </div>

                      <div className="ticket-detail">
                        <span>Venue</span>
                        <strong>
                          {ticket.venue || "Venue to be announced"}
                        </strong>
                      </div>

                      <div className="ticket-detail">
                        <span>Ticket number</span>
                        <strong>
                          {ticket.ticket_number || "Not generated yet"}
                        </strong>
                      </div>
                    </div>

                    <div className="ticket-meta-grid">
                      <div className="ticket-meta">
                        <span>Quantity</span>
                        <strong>{Number(ticket.quantity || 1)}</strong>
                      </div>

                      <div className="ticket-meta">
                        <span>Amount paid</span>
                        <strong>{formatMoney(ticket.amount_paid)}</strong>
                      </div>

                      <div className="ticket-meta">
                        <span>Purchased</span>
                        <strong>{formatPurchaseDate(ticket.created_at)}</strong>
                      </div>
                    </div>
                  </div>

                  <aside className="ticket-qr-panel">
                    <p className="ticket-qr-label">Entry QR</p>

                    {ticket.qrCode ? (
                      <img
                        src={ticket.qrCode}
                        alt={`QR code for ${ticket.ticket_number}`}
                        className="ticket-qr-image"
                      />
                    ) : (
                      <div className="ticket-qr-missing">
                        QR code pending
                      </div>
                    )}

                    <p className="ticket-scan-note">
                      Show this code at the door for entry.
                    </p>
                  </aside>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function getTicketStatus(ticket: TicketRow) {
  if (ticket.used === 1 || ticket.used === true) {
    return {
      label: "Used",
      className: "used",
    };
  }

  if (String(ticket.payment_status || "").toLowerCase() !== "paid") {
    return {
      label: "Processing",
      className: "processing",
    };
  }

  return {
    label: "Ready to scan",
    className: "ready",
  };
}

function formatPaymentStatus(status: string | null) {
  return status ? status.toUpperCase() : "PROCESSING";
}

function formatEventDate(dateValue: string | Date | null) {
  if (!dateValue) {
    return "Date to be announced";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date to be announced";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatEventTime(time: string | null) {
  if (!time) {
    return "time to be announced";
  }

  const [hours, minutes] = time.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPurchaseDate(dateValue: string | Date | null) {
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
