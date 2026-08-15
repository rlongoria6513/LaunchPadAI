import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import DoorSaleForm from "./DoorSaleForm";
import type { RowDataPacket } from "mysql2";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  venue: string;
  ticket_price: number | string;
};

export default async function DoorSalesPage() {
  const session = await auth();

  if (!session) {
    redirect("/promoter/login");
  }

  const role = String(
    (session.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();
  const userId = Number((session.user as { id?: unknown } | undefined)?.id || 0);

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }
  const membership=await getMembershipStatus(userId,role); if(!membership.allowed)redirect("/promoter/membership?required=1");

  const [rows] = await db.execute<EventRow[]>(
    `
    SELECT id, event_name, venue, ticket_price
    FROM events
    WHERE ? = 'admin' OR promoter_id = ?
    ORDER BY event_date ASC
    `,
    [role, userId]
  );

  const events = rows.map((event) => ({
    id: event.id,
    eventName: event.event_name,
    venue: event.venue,
    ticketPrice: Number(event.ticket_price || 0),
  }));

  return (
    <main
      className="lp-back-office-page"
      style={{
        minHeight: "100vh",
      }}
    >
      <div
        className="lp-page-shell"
        style={{
          width: "100%",
          maxWidth: "680px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/promoter"
          style={{
            color: "#93c5fd",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Back to Command Center
        </Link>

        <h1
          className="lp-page-title"
          style={{
            fontSize: "clamp(28px, 8vw, 40px)",
            lineHeight: 1.15,
            margin: "26px 0 10px",
          }}
        >
          Door Sale
        </h1>

        <p
          className="lp-page-copy"
          style={{
            color: "#cbd5e1",
            lineHeight: 1.5,
            margin: "0 0 24px",
          }}
        >
          Create a paid ticket for a guest buying at the entrance.
        </p>

        <DoorSaleForm events={events} />
      </div>
    </main>
  );
}
