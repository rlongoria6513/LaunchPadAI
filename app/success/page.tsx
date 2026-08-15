import db from "@/app/lib/db";
import Link from "next/link";
import { generateQRCode } from "@/app/lib/qrcode";
import { fulfillCheckoutSession } from "@/app/lib/checkoutFulfillment";
import type { RowDataPacket } from "mysql2";

type TicketRow = RowDataPacket & { ticket_number: string; used: number; payment_status: string | null; refund_status: string | null };
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id) return <main className="success-missing"><p>Missing payment session.</p><Link href="/">Return Home</Link></main>;
  const fulfillment = await fulfillCheckoutSession(session_id);
  const session = fulfillment.session;
  const [rows] = await db.execute<TicketRow[]>(`SELECT ticket_number, used, payment_status, refund_status FROM orders WHERE stripe_session_id = ? ORDER BY id ASC`, [session_id]);
  const tickets = await Promise.all(rows.map(async row => ({ ...row, qr: await generateQRCode(row.ticket_number) })));
  const eventName = session.metadata?.event_name || "LaunchPad Ticket";
  const ticketPrice = Number(session.metadata?.ticket_price || 0); const serviceFee = Number(session.metadata?.service_fee || 2);
  const totalPaid = (ticketPrice + serviceFee) * tickets.length;
  return <main className="success-main"><style>{styles}</style><div className="success-card">
    <h1>✅ Payment Successful!</h1><p className="thank-you">Your tickets are ready now—no login required.</p>
    {fulfillment.delivery ? <p className={`delivery-note is-${fulfillment.delivery.sms}`}>{fulfillment.delivery.message}</p> : null}
    {fulfillment.ticketLink ? <div className="success-actions"><Link href={fulfillment.ticketLink}>Open Secure Order Link</Link><a href={`${fulfillment.ticketLink}?print=1`} target="_blank" rel="noreferrer">Print All Tickets</a></div> : null}
    <p className="fallback-note">If text or email is delayed, use the tickets shown below immediately. Save the secure order link for later.</p>
    <div className="success-ticket-list">{tickets.map((ticket, index) => {
      const invalid = ticket.payment_status === "refunded" || ticket.refund_status === "succeeded";
      return <article key={ticket.ticket_number}><span>Ticket {index + 1} of {tickets.length}</span><h2>{eventName}</h2><strong className={invalid ? "invalid" : ticket.used ? "used" : "valid"}>{invalid ? "Canceled / Refunded" : ticket.used ? "Already used" : "Valid for entry"}</strong><img src={ticket.qr} alt={`QR code for ticket ${index + 1}`} /><code>{ticket.ticket_number}</code></article>;
    })}</div>
    <div className="purchase-summary"><span>{tickets.length} ticket{tickets.length === 1 ? "" : "s"}</span><span>Ticket price: ${ticketPrice.toFixed(2)}</span><span>Service fees: ${(serviceFee * tickets.length).toFixed(2)}</span><strong>Total paid: ${totalPaid.toFixed(2)}</strong></div>
    <Link href="/" className="return-button">Return Home</Link>
  </div></main>;
}

const styles = `*{box-sizing:border-box}body{margin:0}.success-main,.success-missing{min-height:100vh;background:#07111f;color:white;padding:30px 16px;font-family:Arial,sans-serif}.success-card{max-width:920px;margin:auto;background:#111827;border:1px solid #334155;border-radius:18px;padding:32px;text-align:center}.success-card>h1{color:#22c55e;font-size:clamp(30px,7vw,46px);margin:0 0 12px}.thank-you,.fallback-note{color:#cbd5e1;line-height:1.55}.delivery-note{border-radius:10px;padding:12px}.delivery-note.is-sent{background:rgba(22,163,74,.16);color:#86efac}.delivery-note.is-failed,.delivery-note.is-disabled{background:rgba(234,179,8,.16);color:#fde68a}.success-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:20px 0}.success-actions a,.return-button{background:#0f766e;border-radius:9px;color:white;font-weight:800;padding:12px 18px;text-decoration:none}.success-ticket-list{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));margin:25px 0}.success-ticket-list article{background:#1e293b;border:1px solid #475569;border-radius:14px;display:grid;gap:10px;padding:20px;place-items:center}.success-ticket-list article>span{color:#67e8f9;font-size:12px;font-weight:800;text-transform:uppercase}.success-ticket-list h2{font-size:21px;margin:0}.success-ticket-list img{background:white;border-radius:10px;max-width:230px;padding:8px;width:100%}.success-ticket-list code{overflow-wrap:anywhere}.valid{color:#86efac}.used{color:#fde68a}.invalid{color:#fca5a5}.purchase-summary{background:#0b1220;border-radius:12px;display:grid;gap:8px;margin:0 auto 24px;max-width:460px;padding:18px}.return-button{display:inline-block;background:#2563eb}@media(max-width:600px){.success-card{padding:22px 12px}.success-main{padding:16px 10px}}`;
