import db from "@/app/lib/db";
import { generateQRCode } from "@/app/lib/qrcode";
import { validateTicketToken } from "@/app/lib/ticketDelivery";
import type { Metadata } from "next";
import type { RowDataPacket } from "mysql2";
import TicketActions from "./TicketActions";

export const metadata: Metadata = { title: "Secure Mobile Tickets | LaunchPad", robots: { index: false, follow: false } };
type TicketRow = RowDataPacket & { ticket_number: string; event_name: string; customer_name: string | null; used: number; payment_status: string | null; refund_status: string | null; event_date: string | Date | null; event_time: string | null; venue: string | null; image_url: string | null };

export default async function MobileTicketsPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ print?: string }> }) {
  const { token } = await params; const link = await validateTicketToken(token);
  if (!link || link.revoked_at) return <Message title="Ticket link unavailable" text={link?.revoke_reason || "This secure ticket link is invalid, expired, canceled, or refunded. Contact the event organizer for help."} />;
  const [rows] = await db.execute<TicketRow[]>(`
    SELECT o.ticket_number, o.event_name, o.customer_name, o.used, o.payment_status,
      o.refund_status, e.event_date, e.event_time, e.venue, e.image_url
    FROM ticket_delivery_link_orders lo JOIN orders o ON o.id = lo.order_id
    LEFT JOIN events e ON e.id = o.event_id WHERE lo.link_id = ? ORDER BY o.id ASC
  `, [link.id]);
  if (!rows.length) return <Message title="Tickets unavailable" text="No tickets are attached to this secure link." />;
  const tickets = await Promise.all(rows.map(async row => ({ ...row, qr: await generateQRCode(row.ticket_number) })));
  const { print } = await searchParams;
  return <main className="mobile-tickets-page"><style>{styles}</style><div className="mobile-ticket-shell">
    <header><p>LaunchPad Secure Delivery</p><h1>{rows[0].event_name}</h1><span>{tickets.length} {tickets.length === 1 ? "ticket" : "tickets"} for {rows[0].customer_name || "Guest"}</span></header>
    <TicketActions autoPrint={print === "1"} />
    <p className="mobile-ticket-help">Your tickets remain visible here even if email or text delivery is delayed. Save this secure link. Do not post it publicly.</p>
    <div className="mobile-ticket-list">{tickets.map((ticket, index) => {
      const refunded = ticket.payment_status === "refunded" || ticket.refund_status === "succeeded";
      return <article key={ticket.ticket_number} className={refunded ? "is-invalid" : ticket.used ? "is-used" : ""}>
        {ticket.image_url ? <img className="ticket-flyer" src={ticket.image_url} alt="" /> : null}
        <div className="ticket-info"><small>Ticket {index + 1} of {tickets.length}</small><h2>{ticket.event_name}</h2>
          <p>{ticket.venue || "Venue to be announced"}</p><p>{formatDate(ticket.event_date)} {ticket.event_time ? `at ${ticket.event_time}` : ""}</p>
          <strong className="ticket-state">{refunded ? "Canceled / Refunded — Not valid for entry" : ticket.used ? "Already used" : "Valid for entry"}</strong>
          <code>{ticket.ticket_number}</code></div>
        <div className="ticket-qr"><img src={ticket.qr} alt={`QR code for ticket ${index + 1}`} /><span>Present at entrance</span></div>
      </article>;
    })}</div>
  </div></main>;
}

function Message({ title, text }: { title: string; text: string }) { return <main style={{ minHeight: "100vh", background: "#07111f", color: "white", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial" }}><div style={{ maxWidth: 620, textAlign: "center" }}><h1>{title}</h1><p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>{text}</p></div></main>; }
function formatDate(value: string | Date | null) { if (!value) return "Date to be announced"; return new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }); }
const styles = `
*{box-sizing:border-box}.mobile-tickets-page{min-height:100vh;background:linear-gradient(135deg,#07111f,#111827 58%,#1e1b4b);color:white;padding:30px 16px 70px;font-family:Arial,sans-serif}.mobile-ticket-shell{max-width:980px;margin:auto}.mobile-ticket-shell header{text-align:center;margin-bottom:20px}.mobile-ticket-shell header p{color:#5eead4;font-weight:800;letter-spacing:2px;text-transform:uppercase}.mobile-ticket-shell h1{font-size:clamp(32px,7vw,54px);margin:8px 0}.mobile-ticket-shell header span,.mobile-ticket-help{color:#cbd5e1}.mobile-ticket-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:22px 0}.mobile-ticket-actions button{background:#14b8a6;border:0;border-radius:9px;color:#042f2e;cursor:pointer;font-weight:800;padding:12px 18px}.mobile-ticket-help{text-align:center;line-height:1.55;margin:0 auto 24px;max-width:700px}.mobile-ticket-list{display:grid;gap:20px}.mobile-ticket-list article{background:#0f172a;border:2px solid #22c55e;border-radius:18px;display:grid;grid-template-columns:180px 1fr 230px;overflow:hidden;min-height:260px}.mobile-ticket-list article.is-used{border-color:#f59e0b}.mobile-ticket-list article.is-invalid{border-color:#ef4444;opacity:.78}.ticket-flyer{height:100%;object-fit:cover;width:100%}.ticket-info{padding:24px}.ticket-info small{color:#67e8f9;font-weight:800;text-transform:uppercase}.ticket-info h2{font-size:26px;margin:10px 0}.ticket-info p{color:#cbd5e1;margin:7px 0}.ticket-info code{display:block;margin-top:15px;overflow-wrap:anywhere}.ticket-state{display:block;color:#86efac;margin-top:18px}.is-used .ticket-state{color:#fde68a}.is-invalid .ticket-state{color:#fecaca}.ticket-qr{background:white;color:#0f172a;display:grid;place-items:center;padding:18px;text-align:center;font-weight:800}.ticket-qr img{max-width:190px;width:100%}.ticket-qr span{font-size:13px}@media(max-width:720px){.mobile-ticket-list article{grid-template-columns:1fr}.ticket-flyer{height:220px}.ticket-qr img{max-width:240px}}@media print{.mobile-tickets-page{background:white;color:black;padding:0}.mobile-ticket-actions,.mobile-ticket-help{display:none}.mobile-ticket-shell header p,.mobile-ticket-shell header span{color:#333}.mobile-ticket-list article{break-inside:avoid;border-color:#333;margin-bottom:18px}.ticket-info{color:black}.ticket-info p{color:#333}}
`;
