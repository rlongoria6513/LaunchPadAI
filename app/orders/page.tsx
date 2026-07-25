import Link from "next/link";
import db from "@/app/lib/db";
export default async function OrdersPage() {
    const [orders]: any = await db.execute(`
  SELECT *
  FROM orders
  ORDER BY id DESC
`);
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        padding: "40px",
      }}
    >
      <h1 style={{ fontSize: "42px", marginBottom: "20px" }}>
        🎟 Orders Dashboard
      </h1>

      <p style={{ marginBottom: "30px" }}>
        This page will show every ticket sold.
      </p>

      <div
        style={{
          background: "#1f1f1f",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th align="left">Ticket</th>
              <th align="left">Customer</th>
              <th align="left">Event</th>
              <th align="left">Status</th>
            </tr>
          </thead>

          <tbody>
  {orders.map((order: any) => (
    <tr key={order.id}>
      <td>{order.stripe_session_id}</td>
      <td>{order.customer_name}</td>
      <td>{order.event_name}</td>
      <td>{order.payment_status}</td>
    </tr>
  ))}
</tbody>
        </table>
      </div>

      <br />

      <Link href="/">
        ← Back Home
      </Link>
    </main>
  );
}