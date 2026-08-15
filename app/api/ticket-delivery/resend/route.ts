import db from "@/app/lib/db";
import { canAccessEvent, getEventDayUser } from "@/app/lib/eventDayAuth";
import { sendTicketEmail } from "@/app/lib/email";
import { generateTicketPDF } from "@/app/lib/pdf";
import { generateQRCode } from "@/app/lib/qrcode";
import { deliverTicketText, logEmailDelivery, newResendKey, validateTicketToken, absoluteTicketUrl } from "@/app/lib/ticketDelivery";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

type TicketRow = RowDataPacket & { id: number; event_id: number; event_name: string; customer_name: string; customer_email: string; customer_phone: string; ticket_number: string; image_url: string | null; venue: string | null; event_date: string | Date | null; event_time: string | null };

export async function POST(request: Request) {
  const user = await getEventDayUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const rawLink = String(body.ticketLink || "");
  const token = rawLink.split("/mobile-tickets/")[1]?.split("?")[0] || "";
  const link = await validateTicketToken(token);
  if (!link || link.revoked_at) return NextResponse.json({ error: "This secure ticket link is invalid or revoked." }, { status: 404 });
  const [tickets] = await db.execute<TicketRow[]>(`SELECT o.id, o.event_id, o.event_name, o.customer_name, o.customer_email, o.customer_phone, o.ticket_number, e.image_url, e.venue, e.event_date, e.event_time FROM ticket_delivery_link_orders lo JOIN orders o ON o.id = lo.order_id LEFT JOIN events e ON e.id = o.event_id WHERE lo.link_id = ? ORDER BY o.id`, [link.id]);
  if (!tickets.length) return NextResponse.json({ error: "No tickets are attached to this link." }, { status: 404 });
  if (user.role !== "admin") for (const eventId of new Set(tickets.map(ticket => Number(ticket.event_id)))) if (!(await canAccessEvent(user, eventId, "sell"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const channel = body.channel === "email" ? "email" : "sms";
  if (channel === "sms") {
    const result = await deliverTicketText({ linkId: Number(link.id), publicId: link.public_id, phone: tickets[0].customer_phone || "", eventName: tickets[0].event_name, idempotencyKey: newResendKey(`link:${link.public_id}:sms`), attemptedBy: user.id });
    return NextResponse.json({ success: result.sms === "sent", status: result.sms, message: result.message }, { status: result.sms === "sent" ? 200 : 503 });
  }
  const email = tickets[0].customer_email;
  if (!email) return NextResponse.json({ error: "No customer email is stored for these tickets." }, { status: 400 });
  let sent = 0;
  for (const ticket of tickets) {
    const key = newResendKey(`link:${link.public_id}:email:${ticket.id}`);
    try {
      const qrCode = await generateQRCode(ticket.ticket_number);
      const pdf = await generateTicketPDF({ customerName: ticket.customer_name || "Guest", eventName: ticket.event_name, ticketNumber: ticket.ticket_number, imageUrl: ticket.image_url || "", qrCode, venue: ticket.venue || "", eventDate: String(ticket.event_date || ""), eventTime: ticket.event_time || "" });
      await sendTicketEmail({ to: email, name: ticket.customer_name || "Guest", eventName: ticket.event_name, ticketNumber: ticket.ticket_number, qrCode, imageUrl: ticket.image_url || "", pdf, mobileTicketUrl: absoluteTicketUrl(link.public_id) });
      await logEmailDelivery({ linkId: Number(link.id), orderId: ticket.id, email, status: "sent", idempotencyKey: key }); sent += 1;
    } catch (error) { await logEmailDelivery({ linkId: Number(link.id), orderId: ticket.id, email, status: "failed", error: error instanceof Error ? error.message : "Email failed", idempotencyKey: key }).catch(() => undefined); }
  }
  return NextResponse.json({ success: sent === tickets.length, message: sent === tickets.length ? "Ticket email resent." : `Email sent for ${sent} of ${tickets.length} tickets. The secure link still displays every ticket.` }, { status: sent ? 200 : 503 });
}
