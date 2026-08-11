import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";

type ReportRow = RowDataPacket & {
  event_id: number | null;
  event_name: string | null;
  venue: string | null;
  event_date: string | Date | null;
  event_time: string | null;
  ticket_records: number | string | null;
  tickets_sold: number | string | null;
  checked_in: number | string | null;
  ticket_revenue: number | string | null;
  service_fees: number | string | null;
  total_collected: number | string | null;
  last_sale_at: string | Date | null;
};

export default async function PromoterReportsPage() {
  const session = await auth();

  if (!session) {
    redirect("/promoter/login");
  }

  const role = String(
    (session.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  const [rows] = await db.execute<ReportRow[]>(
    `
    SELECT
      o.event_id,
      o.event_name,
      e.venue,
      e.event_date,
      e.event_time,
      COUNT(*) AS ticket_records,
      COALESCE(SUM(COALESCE(o.quantity, 1)), 0) AS tickets_sold,
      COALESCE(SUM(CASE WHEN o.used = 1 THEN 1 ELSE 0 END), 0) AS checked_in,
      COALESCE(SUM(o.amount_paid), 0) AS ticket_revenue,
      COALESCE(SUM(o.service_fee), 0) AS service_fees,
      COALESCE(SUM(o.total_charged), 0) AS total_collected,
      MAX(o.created_at) AS last_sale_at
    FROM orders o
    LEFT JOIN events e
      ON o.event_id = e.id
    WHERE LOWER(o.payment_status) = 'paid'
    GROUP BY
      o.event_id,
      o.event_name,
      e.venue,
      e.event_date,
      e.event_time
    ORDER BY last_sale_at DESC
    `
  );

  const totals = rows.reduce(
    (summary, row) => {
      summary.ticketRecords += toNumber(row.ticket_records);
      summary.ticketsSold += toNumber(row.tickets_sold);
      summary.checkedIn += toNumber(row.checked_in);
      summary.ticketRevenue += toNumber(row.ticket_revenue);
      summary.serviceFees += toNumber(row.service_fees);
      summary.totalCollected += toNumber(row.total_collected);

      return summary;
    },
    {
      ticketRecords: 0,
      ticketsSold: 0,
      checkedIn: 0,
      ticketRevenue: 0,
      serviceFees: 0,
      totalCollected: 0,
    }
  );

  const remaining = Math.max(
    totals.ticketRecords - totals.checkedIn,
    0
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
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

        <header style={{ margin: "26px 0 24px" }}>
          <p
            style={{
              color: "#67e8f9",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "2px",
              margin: "0 0 8px",
              textTransform: "uppercase",
            }}
          >
            Promoter Reporting
          </p>

          <h1
            style={{
              fontSize: "clamp(30px, 8vw, 42px)",
              lineHeight: 1.1,
              margin: "0 0 10px",
            }}
          >
            Sales & Check-In Reports
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Review paid ticket sales, fees, and event-day check-ins.
          </p>
        </header>

        <section style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Ticket Records</span>
            <strong style={summaryNumberStyle}>
              {totals.ticketRecords}
            </strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Tickets Sold</span>
            <strong style={summaryNumberStyle}>
              {totals.ticketsSold}
            </strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Checked In</span>
            <strong style={summaryNumberStyle}>
              {totals.checkedIn}
            </strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Remaining</span>
            <strong style={summaryNumberStyle}>{remaining}</strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Ticket Revenue</span>
            <strong style={summaryNumberStyle}>
              {money(totals.ticketRevenue)}
            </strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Service Fees</span>
            <strong style={summaryNumberStyle}>
              {money(totals.serviceFees)}
            </strong>
          </div>

          <div style={summaryCardStyle}>
            <span style={summaryLabelStyle}>Total Collected</span>
            <strong style={summaryNumberStyle}>
              {money(totals.totalCollected)}
            </strong>
          </div>
        </section>

        {rows.length === 0 ? (
          <section style={emptyStyle}>
            No paid ticket sales are available for reporting yet.
          </section>
        ) : (
          <section style={{ display: "grid", gap: "16px" }}>
            {rows.map((row) => {
              const checkedIn = toNumber(row.checked_in);
              const ticketRecords = toNumber(row.ticket_records);
              const checkInRate =
                ticketRecords > 0
                  ? Math.round((checkedIn / ticketRecords) * 100)
                  : 0;

              return (
                <article
                  key={`${row.event_id || "unknown"}-${row.event_name}`}
                  style={reportCardStyle}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h2
                        style={{
                          margin: "0 0 6px",
                          fontSize: "24px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {row.event_name || "Unknown Event"}
                      </h2>

                      <p
                        style={{
                          color: "#94a3b8",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {row.venue || "Venue not set"} ·{" "}
                        {formatEventDate(row.event_date, row.event_time)}
                      </p>
                    </div>

                    <span style={rateBadgeStyle}>
                      {checkInRate}% checked in
                    </span>
                  </div>

                  <div style={detailGridStyle}>
                    <ReportMetric
                      label="Ticket Records"
                      value={ticketRecords}
                    />
                    <ReportMetric
                      label="Tickets Sold"
                      value={toNumber(row.tickets_sold)}
                    />
                    <ReportMetric label="Checked In" value={checkedIn} />
                    <ReportMetric
                      label="Ticket Revenue"
                      value={money(toNumber(row.ticket_revenue))}
                    />
                    <ReportMetric
                      label="Service Fees"
                      value={money(toNumber(row.service_fees))}
                    />
                    <ReportMetric
                      label="Total Collected"
                      value={money(toNumber(row.total_collected))}
                    />
                  </div>

                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      margin: "14px 0 0",
                    }}
                  >
                    Last sale: {formatDate(row.last_sale_at)}
                  </p>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function ReportMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={detailBoxStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <strong style={detailValueStyle}>{value}</strong>
    </div>
  );
}

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date?: string | Date | null) {
  if (!date) {
    return "No sales yet";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No sales yet";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventDate(
  date?: string | Date | null,
  time?: string | null
) {
  if (!date) {
    return time || "Date not set";
  }

  const parsedDate = new Date(date);
  const displayDate = Number.isNaN(parsedDate.getTime())
    ? String(date)
    : parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return time ? `${displayDate} at ${time}` : displayDate;
}

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "14px",
  marginBottom: "24px",
};

const summaryCardStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "14px",
  padding: "18px",
  display: "grid",
  gap: "7px",
};

const summaryLabelStyle = {
  color: "#cbd5e1",
  fontSize: "14px",
};

const summaryNumberStyle = {
  color: "white",
  fontSize: "clamp(24px, 6vw, 30px)",
  overflowWrap: "anywhere" as const,
};

const reportCardStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "16px",
  padding: "20px",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
  gap: "12px",
};

const detailBoxStyle = {
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "11px",
  padding: "13px",
  minWidth: 0,
};

const detailLabelStyle = {
  color: "#94a3b8",
  display: "block",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "0.8px",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
};

const detailValueStyle = {
  color: "white",
  display: "block",
  fontSize: "18px",
  overflowWrap: "anywhere" as const,
};

const rateBadgeStyle = {
  border: "1px solid #22c55e",
  background: "rgba(34,197,94,0.18)",
  borderRadius: "999px",
  color: "#bbf7d0",
  fontSize: "13px",
  fontWeight: "bold",
  padding: "8px 11px",
};

const emptyStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "16px",
  padding: "28px",
  color: "#cbd5e1",
  textAlign: "center" as const,
};
