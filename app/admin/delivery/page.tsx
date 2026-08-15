import { auth } from "@/app/auth";
import { getSmsSettings, listDeliveryLogs, ticketPath } from "@/app/lib/ticketDelivery";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeliveryAdmin from "./DeliveryAdmin";
type User = { role?: unknown };

export default async function DeliveryPage() {
  const session = await auth(); const user = session?.user as User | undefined;
  if (!session) redirect("/login"); if (String(user?.role || "").toLowerCase() !== "admin") redirect("/dashboard");
  const [settings, rows] = await Promise.all([getSmsSettings(), listDeliveryLogs()]);
  const logs = rows.map(row => ({ id: Number(row.id), channel: String(row.channel), recipient: String(row.recipient), status: String(row.status), error: String(row.error_message || ""), eventName: String(row.event_name || ""), customerName: String(row.customer_name || ""), createdAt: String(row.created_at), ticketLink: row.public_id ? ticketPath(String(row.public_id)) : "" }));
  return <main className="lp-back-office-page"><div className="lp-page-shell"><div className="lp-page-header"><div><p className="lp-page-kicker">Admin delivery center</p><h1 className="lp-page-title">📨 Ticket Delivery</h1><p className="lp-page-copy">Control transactional SMS, review email/text results, and resend secure ticket links.</p></div><Link href="/admin" className="lp-button-secondary">Back to Admin</Link></div><DeliveryAdmin initialSettings={settings} logs={logs} /></div></main>;
}
