import { auth } from "@/app/auth";
import { canAccessEvent, getEventDayUser } from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { generateQRCode } from "@/app/lib/qrcode";
import Link from "next/link";
import { redirect } from "next/navigation";
import PrintTicketButton from "./PrintTicketButton";
import type { RowDataPacket } from "mysql2";

type TicketRow = RowDataPacket & {
  id: number;
  customer_name: string | null;
  customer_email: string | null;
  event_id: number | null;
  event_name: string | null;
  ticket_number: string | null;
  payment_status: string | null;
  ticket_type: string | null;
  venue: string | null;
  event_date: string | Date | null;
  event_time: string | null;
  image_url: string | null;
};

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const ticketId = Number(id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    redirect("/my-tickets");
  }

  const [rows] = await db.execute<TicketRow[]>(
    `
    SELECT
      o.id,
      o.customer_name,
      o.customer_email,
      o.event_id,
      o.event_name,
      o.ticket_number,
      o.payment_status,
      o.ticket_type,
      e.venue,
      e.event_date,
      e.event_time,
      e.image_url
    FROM orders o
    LEFT JOIN events e
      ON o.event_id = e.id
    WHERE o.id = ?
    LIMIT 1
    `,
    [ticketId]
  );

  if (!rows.length) {
    redirect("/my-tickets");
  }

  const ticket = rows[0];
  const role = String(
    (session.user as { role?: unknown }).role || ""
  ).toLowerCase();
  const isCustomerOwner =
    role === "customer" &&
    ticket.customer_email &&
    session.user.email &&
    ticket.customer_email.toLowerCase() === session.user.email.toLowerCase();
  const eventDayUser = await getEventDayUser();
  const staffAllowed =
    eventDayUser && ticket.event_id
      ? await canAccessEvent(eventDayUser, ticket.event_id, "scan")
      : false;

  if (!isCustomerOwner && !staffAllowed) {
    redirect("/dashboard");
  }

  const qrCode = ticket.ticket_number
    ? await generateQRCode(ticket.ticket_number)
    : null;

  return (
    <main className="ticket-print-page">
      <style>{styles}</style>
      <div className="ticket-actions">
        <Link href="/my-tickets">My Tickets</Link>
        <PrintTicketButton />
      </div>

      <section className="print-ticket">
        <div className="flyer">
          {ticket.image_url ? (
            <img src={ticket.image_url} alt="" />
          ) : (
            <span>LP</span>
          )}
        </div>
        <div className="ticket-body">
          <p className="eyebrow">LaunchPad Admission</p>
          <h1>{ticket.event_name || "LaunchPad Event"}</h1>
          <div className="details">
            <div>
              <span>Date</span>
              <strong>{formatDate(ticket.event_date)}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{formatTime(ticket.event_time)}</strong>
            </div>
            <div>
              <span>Venue</span>
              <strong>{ticket.venue || "Venue to be announced"}</strong>
            </div>
            <div>
              <span>Guest</span>
              <strong>{ticket.customer_name || "Guest"}</strong>
            </div>
            <div>
              <span>Ticket Number</span>
              <strong>{ticket.ticket_number || "Pending"}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{(ticket.ticket_type || "standard").toUpperCase()}</strong>
            </div>
          </div>
        </div>
        <aside className="qr-panel">
          {qrCode ? <img src={qrCode} alt="Ticket QR code" /> : null}
          <strong>{ticket.ticket_number}</strong>
        </aside>
      </section>
    </main>
  );
}

function formatDate(value: string | Date | null) {
  if (!value) {
    return "Date TBA";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(value: string | null) {
  if (!value) {
    return "Time TBA";
  }

  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = `
  .ticket-print-page {
    min-height: 100vh;
    background: #111827;
    color: white;
    padding: 30px 16px;
    font-family: Arial, sans-serif;
  }
  .ticket-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 20px;
  }
  .ticket-actions a,
  .ticket-actions button {
    background: #2563eb;
    border: 0;
    border-radius: 9px;
    color: white;
    font-weight: 800;
    padding: 11px 14px;
    text-decoration: none;
  }
  .print-ticket {
    background: #fffdf8;
    border: 4px solid #06b6d4;
    border-radius: 18px;
    color: #111827;
    display: grid;
    grid-template-columns: 260px 1fr 220px;
    margin: 0 auto;
    max-width: 960px;
    min-height: 330px;
    overflow: hidden;
  }
  .flyer {
    align-items: center;
    background: #0f172a;
    display: flex;
    justify-content: center;
  }
  .flyer img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
  .flyer span {
    color: #bfdbfe;
    font-size: 60px;
    font-weight: 900;
  }
  .ticket-body {
    padding: 28px;
  }
  .eyebrow {
    color: #0891b2;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 2px;
    margin: 0 0 8px;
    text-transform: uppercase;
  }
  h1 {
    font-size: 34px;
    line-height: 1.08;
    margin: 0 0 22px;
  }
  .details {
    border-bottom: 1px solid #cbd5e1;
    border-top: 1px solid #cbd5e1;
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 18px 0;
  }
  .details span {
    color: #64748b;
    display: block;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1px;
    margin-bottom: 5px;
    text-transform: uppercase;
  }
  .details strong {
    overflow-wrap: anywhere;
  }
  .qr-panel {
    align-items: center;
    background: #06b6d4;
    border-left: 4px dashed white;
    color: #082f49;
    display: flex;
    flex-direction: column;
    gap: 14px;
    justify-content: center;
    padding: 20px;
    text-align: center;
  }
  .qr-panel img {
    background: white;
    border-radius: 12px;
    height: 160px;
    padding: 10px;
    width: 160px;
  }
  @media (max-width: 760px) {
    .print-ticket {
      grid-template-columns: 1fr;
    }
    .flyer {
      min-height: 220px;
    }
    .qr-panel {
      border-left: 0;
      border-top: 4px dashed white;
    }
  }
  @media print {
    body {
      background: white !important;
    }
    .launchpad-header,
    .ticket-actions {
      display: none !important;
    }
    .ticket-print-page {
      background: white;
      min-height: auto;
      padding: 0;
    }
    .print-ticket {
      break-inside: avoid;
      margin: 0;
      max-height: 7.5in;
      max-width: 10.5in;
      page-break-inside: avoid;
      transform: scale(0.94);
      transform-origin: top left;
      width: 10.5in;
    }
    @page {
      margin: 0.25in;
      size: landscape;
    }
  }
`;
