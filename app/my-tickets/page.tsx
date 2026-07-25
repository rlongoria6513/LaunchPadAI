import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { generateQRCode } from "@/app/lib/qrcode";
import { redirect } from "next/navigation";

export default async function MyTicketsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const [rows]: any = await db.execute(
    `
    SELECT
      id,
      event_name,
      ticket_number,
      quantity,
      amount_paid,
      payment_status,
      used,
      created_at
    FROM orders
    WHERE customer_email = ?
    ORDER BY created_at DESC
    `,
    [session.user.email]
  );

  const tickets = await Promise.all(
    rows.map(async (ticket: any) => ({
      ...ticket,
      qrCode: ticket.ticket_number
        ? await generateQRCode(ticket.ticket_number)
        : null,
    }))
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px" }}>🎟️ My Tickets</h1>

        <p style={{ color: "#cbd5e1", marginBottom: "30px" }}>
          Signed in as {session.user.email}
        </p>

        {tickets.length === 0 ? (
          <p>You have not purchased any tickets yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "24px" }}>
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                style={{
                  background: "#1f2937",
                  padding: "24px",
                  borderRadius: "14px",
                  border: "1px solid #374151",
                }}
              >
                <h2 style={{ fontSize: "26px", marginBottom: "12px" }}>
                  {ticket.event_name}
                </h2>

                <p>
                  <strong>Ticket:</strong>{" "}
                  {ticket.ticket_number || "Not generated"}
                </p>

                <p>
                  <strong>Quantity:</strong> {ticket.quantity}
                </p>

                <p>
                  <strong>Amount paid:</strong> $
                  {Number(ticket.amount_paid).toFixed(2)}
                </p>

                <p>
                  <strong>Payment:</strong> {ticket.payment_status}
                </p>

                <p>
                  <strong>Entry status:</strong>{" "}
                  {ticket.used === 1 ? "Already used" : "Ready to scan"}
                </p>

                {ticket.qrCode && (
                  <img
                    src={ticket.qrCode}
                    alt={`QR code for ${ticket.ticket_number}`}
                    style={{
                      width: "220px",
                      height: "220px",
                      background: "white",
                      padding: "10px",
                      borderRadius: "12px",
                      marginTop: "20px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}