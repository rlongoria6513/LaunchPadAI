import db from "@/app/lib/db";
import Link from "next/link";
import Stripe from "stripe";
import  {  generateQRCode }  from "@/app/lib/qrcode";
import { generateTicketNumber } from "@/app/lib/ticket";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  
  const { session_id } = await searchParams;
  if (!session_id) {
  return (
    <main style={{ padding: "40px", color: "white", background: "#111" }}>
      <h1>Missing payment session.</h1>
      <Link href="/">Return Home</Link>
    </main>
  );
}
const session = await stripe.checkout.sessions.retrieve(session_id);
const eventName = session.metadata?.event_name || "LaunchPad Ticket";
const quantity = Number(session.metadata?.quantity || 1);
const ticketPrice = Number(session.metadata?.ticket_price || 0);

const customerName =
  session.customer_details?.name || "Guest";

const paymentStatus = session.payment_status;

const customerEmail =
  session.customer_details?.email || "";

const customerPhone =
  session.customer_details?.phone || "";

  
 const [ticketRows]: any = await db.execute(
  `
  SELECT ticket_number
  FROM orders
  WHERE stripe_session_id = ?
  ORDER BY id ASC
  LIMIT 1
  `,
  [session_id]
);

const ticketNumber = ticketRows[0]?.ticket_number || "Processing";
  

 const qrCode = await generateQRCode(ticketNumber);
    return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          width: "100%",
          background: "#1b1b1b",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "#22c55e",
            fontSize: "42px",
            marginBottom: "20px",
          }}
        >
          ✅ Payment Successful!
        </h1>

        <p style={{ fontSize: "20px", marginBottom: "30px" }}>
          Thank you for your purchase.
        </p>

        <div
          style={{
            background: "#2a2a2a",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "30px",
          }}
        >
          <h2>Your payment has been received.</h2>

<h3
  style={{
    color: "#22c55e",
    marginTop: "20px",
    fontSize: "28px",
  }}
>
  Ticket Number
</h3>

<p
  style={{
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "2px",
    marginBottom: "20px",
  }}
>
  {ticketNumber}
</p>
<img
  src={qrCode}
  alt="QR Code"
  style={{
    width: "250px",
    height: "250px",
    marginTop: "20px",
    borderRadius: "12px",
    background: "white",
    padding: "10px",
  }}
/>
<p>
  Save this ticket number. Soon you'll receive a QR code that can be scanned at the event.
</p>
        </div>

        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "#22c55e",
            color: "white",
            textDecoration: "none",
            padding: "15px 35px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}