import db from "../../lib/db";
import StripeCheckoutButton  from "@/app/components/StripeCheckoutButton";
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await db.execute(
    "SELECT * FROM events WHERE id = ?",
    [id]
  );

  if (rows.length === 0) {
    return (
      <main style={{ padding: "40px", color: "white" }}>
        <h1>Event not found</h1>
      </main>
    );
  }

  const event = rows[0];

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        color: "white",
        background: "#1b1b1b",
        padding: "30px",
        borderRadius: "12px",
      }}
    >
      <h1>{event.event_name}</h1>

      <h2>{event.venue}</h2>

      <p>Date: {new Date(event.event_date).toLocaleDateString()}</p>

      <p>Time: {event.event_time}</p>

      <h3>${event.ticket_price}</h3>

      <br />

      <label>Quantity</label>

      <select
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "10px",
          marginBottom: "30px",
        }}
      >
        <option>1 Ticket</option>
        <option>2 Tickets</option>
        <option>3 Tickets</option>
        <option>4 Tickets</option>
      </select>
        
              <StripeCheckoutButton
        eventName={event.event_name}
        price={Number(event.ticket_price)}
      />
    </main>
  );
}