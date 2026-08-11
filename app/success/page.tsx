import db from "@/app/lib/db";
import Link from "next/link";
import { generateQRCode } from "@/app/lib/qrcode";
import { fulfillCheckoutSession } from "@/app/lib/checkoutFulfillment";
import type { RowDataPacket } from "mysql2";

type TicketRow = RowDataPacket & {
  ticket_number: string;
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#111",
          color: "white",
          padding: "30px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p>Missing payment session.</p>

        <Link
          href="/"
          style={{
            color: "#22c55e",
          }}
        >
          Return Home
        </Link>
      </main>
    );
  }

  const fulfillment = await fulfillCheckoutSession(session_id);
  const session = fulfillment.session;

  const eventName =
    session.metadata?.event_name || "LaunchPad Ticket";

  const quantity = Number(session.metadata?.quantity || 1);

  const ticketPrice = Number(
    session.metadata?.ticket_price || 0
  );

  const serviceFee = Number(
    session.metadata?.service_fee || 2
  );

  const totalPaid =
    ticketPrice * quantity + serviceFee * quantity;

  const [ticketRows] = await db.execute<TicketRow[]>(
    `
    SELECT ticket_number
    FROM orders
    WHERE stripe_session_id = ?
    ORDER BY id ASC
    LIMIT 1
    `,
    [session_id]
  );

  const ticketNumber =
    fulfillment.ticketNumbers[0] ||
    ticketRows?.[0]?.ticket_number ||
    "Processing";

  const qrCode = await generateQRCode(ticketNumber);

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .success-main {
          min-height: 100vh;
          background: #111;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 30px 16px;
          font-family: Arial, sans-serif;
        }

        .success-card {
          width: 100%;
          max-width: 700px;
          background: #1b1b1b;
          border-radius: 18px;
          padding: 38px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        }

        .success-title {
          color: #22c55e;
          font-size: 42px;
          margin: 0 0 18px;
        }

        .thank-you {
          font-size: 20px;
          margin-bottom: 28px;
        }

        .ticket-box {
          background: #2a2a2a;
          padding: 28px;
          border-radius: 14px;
          margin-bottom: 28px;
        }

        .ticket-number {
          color: white;
          font-size: 25px;
          font-weight: bold;
          letter-spacing: 1px;
          overflow-wrap: anywhere;
          word-break: break-word;
          margin: 10px auto 22px;
        }

        .qr-image {
          width: 100%;
          max-width: 300px;
          height: auto;
          display: block;
          margin: 0 auto;
          background: white;
          padding: 10px;
          border-radius: 14px;
        }

        .event-name {
          font-size: 22px;
          font-weight: bold;
          margin: 22px 0 8px;
        }

        .ticket-details {
          color: #cbd5e1;
          line-height: 1.7;
          margin-top: 12px;
        }

        .return-button {
          display: inline-block;
          background: #22c55e;
          color: white;
          text-decoration: none;
          padding: 16px 35px;
          border-radius: 10px;
          font-weight: bold;
          font-size: 18px;
          width: 100%;
          max-width: 340px;
        }

        @media (max-width: 600px) {
          .success-main {
            align-items: flex-start;
            padding: 18px 12px;
          }

          .success-card {
            padding: 24px 14px;
            border-radius: 14px;
          }

          .success-title {
            font-size: 30px;
          }

          .thank-you {
            font-size: 17px;
            margin-bottom: 20px;
          }

          .ticket-box {
            padding: 20px 12px;
          }

          .ticket-box h2 {
            font-size: 18px;
          }

          .ticket-box h3 {
            font-size: 21px;
          }

          .ticket-number {
            font-size: 18px;
            letter-spacing: 0;
          }

          .qr-image {
            max-width: 250px;
          }

          .event-name {
            font-size: 19px;
          }

          .ticket-details {
            font-size: 15px;
          }

          .return-button {
            font-size: 17px;
          }
        }
      `}</style>

      <main className="success-main">
        <div className="success-card">
          <h1 className="success-title">
            ✅ Payment Successful!
          </h1>

          <p className="thank-you">
            Thank you for your purchase.
          </p>

          <div className="ticket-box">
            <h2>Your payment has been received.</h2>

            <h3
              style={{
                color: "#22c55e",
                marginBottom: "8px",
              }}
            >
              Ticket Number
            </h3>

            <div className="ticket-number">
              {ticketNumber}
            </div>

            <img
              src={qrCode}
              alt="Ticket QR Code"
              className="qr-image"
            />

            <div className="event-name">
              🎟️ {eventName}
            </div>

            <div className="ticket-details">
              <div>
                Tickets: <strong>{quantity}</strong>
              </div>

              <div>
                Ticket Price:{" "}
                <strong>${ticketPrice.toFixed(2)}</strong>
              </div>

              <div>
                Service Fee:{" "}
                <strong>
                  ${(serviceFee * quantity).toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "18px",
                  color: "white",
                }}
              >
                Total Paid:{" "}
                <strong>${totalPaid.toFixed(2)}</strong>
              </div>
            </div>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: "1.5",
                margin: "20px 0 0",
              }}
            >
              Keep this ticket handy. The QR code will be
              scanned when you enter the event.
            </p>
          </div>

          <Link href="/" className="return-button">
            Return Home
          </Link>
        </div>
      </main>
    </>
  );
}
