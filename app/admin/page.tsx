import Link from "next/link";
import { auth } from "../auth";
import { redirect } from "next/navigation";
import db from "@/app/lib/db";
import type { RowDataPacket } from "mysql2";

type SessionUser = {
  role?: unknown;
};

type AdminStatsRow = RowDataPacket & {
  total_tickets: number | string | null;
  ticket_revenue: number | string | null;
  launchpad_fees: number | string | null;
  total_collected: number | string | null;
  used_tickets: number | string | null;
  unused_tickets: number | string | null;
};

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const role = String((user as SessionUser | undefined)?.role || "").toLowerCase();

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const [statsRows] = await db.execute<AdminStatsRow[]>(`
    SELECT
      COUNT(*) AS total_tickets,
      COALESCE(SUM(amount_paid), 0) AS ticket_revenue,
      COALESCE(SUM(service_fee), 0) AS launchpad_fees,
      COALESCE(SUM(total_charged), 0) AS total_collected,
      COALESCE(SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END), 0) AS used_tickets,
      COALESCE(SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END), 0) AS unused_tickets
    FROM orders
    WHERE payment_status = 'paid'
  `);

  const stats = statsRows?.[0] || {};

  const totalTickets = Number(stats.total_tickets || 0);
  const ticketRevenue = Number(stats.ticket_revenue || 0);
  const launchpadFees = Number(stats.launchpad_fees || 0);
  const totalCollected = Number(stats.total_collected || 0);
  const usedTickets = Number(stats.used_tickets || 0);
  const unusedTickets = Number(stats.unused_tickets || 0);

  const money = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const cards = [
    {
      title: "Manage Users",
      description: "View customers, promoters, and administrators.",
      link: "/admin/users",
      icon: "👥",
    },
    {
      title: "Promoter Requests",
      description: "Approve or review promoter applications.",
      link: "/admin/promoters",
      icon: "🎤",
    },
    {
      title: "Manage Events",
      description: "View all events listed on LaunchPad AI.",
      link: "/admin/events",
      icon: "🎟️",
    },
    {
      title: "Orders & Tickets",
      description: "Review ticket orders and payment information.",
      link: "/admin/orders",
      icon: "🧾",
    },
    {
      title: "Rebranding",
      description: "Customize global site name, colors, headline, and footer.",
      link: "/admin/rebranding",
      icon: "🎨",
    },
    {
      title: "LaunchPad AI Tools",
      description: "Create event copy and control AI access and daily limits.",
      link: "/admin/ai-tools",
      icon: "✨",
    },
  ];

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
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "35px",
          }}
        >
          <p
            style={{
              color: "#a5b4fc",
              fontSize: "14px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "8px",
            }}
          >
            Back Office
          </p>

          <h1
            style={{
              fontSize: "38px",
              margin: "0 0 10px",
            }}
          >
            👑 LaunchPad AI Admin Panel
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "17px",
              margin: 0,
            }}
          >
            Welcome, {user?.name || user?.email || "Administrator"}
          </p>
        </div>

        {/* BUSINESS STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Tickets Sold
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginTop: "8px",
              }}
            >
              {totalTickets}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Ticket Revenue
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginTop: "8px",
              }}
            >
              {money(ticketRevenue)}
            </div>

            <div
              style={{
                color: "#94a3b8",
                marginTop: "6px",
                fontSize: "13px",
              }}
            >
              Promoter ticket sales
            </div>
          </div>

          <div
            style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.35)",
              borderRadius: "16px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#86efac",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              LaunchPad Earnings
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginTop: "8px",
              }}
            >
              {money(launchpadFees)}
            </div>

            <div
              style={{
                color: "#86efac",
                marginTop: "6px",
                fontSize: "13px",
              }}
            >
              Service fees earned
            </div>
          </div>

          <div
            style={{
              background: "rgba(99,102,241,0.14)",
              border: "1px solid rgba(129,140,248,0.35)",
              borderRadius: "16px",
              padding: "22px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#c7d2fe",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Total Collected
            </div>

            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                marginTop: "8px",
              }}
            >
              {money(totalCollected)}
            </div>

            <div
              style={{
                color: "#c7d2fe",
                marginTop: "6px",
                fontSize: "13px",
              }}
            >
              Tickets + service fees
            </div>
          </div>
        </div>

        {/* SCANNER STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "16px",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ color: "#94a3b8" }}>Checked In</div>

            <div
              style={{
                fontSize: "26px",
                fontWeight: "bold",
                marginTop: "6px",
              }}
            >
              ✅ {usedTickets}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ color: "#94a3b8" }}>Not Checked In</div>

            <div
              style={{
                fontSize: "26px",
                fontWeight: "bold",
                marginTop: "6px",
              }}
            >
              🎟️ {unusedTickets}
            </div>
          </div>
        </div>

        {/* ADMIN TOOLS */}
        <h2
          style={{
            marginBottom: "18px",
          }}
        >
          Admin Tools
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "20px",
          }}
        >
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.link}
              style={{
                display: "block",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "16px",
                padding: "25px",
                color: "white",
                textDecoration: "none",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  marginBottom: "15px",
                }}
              >
                {card.icon}
              </div>

              <h2
                style={{
                  fontSize: "21px",
                  margin: "0 0 10px",
                }}
              >
                {card.title}
              </h2>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                {card.description}
              </p>
            </Link>
          ))}
        </div>

        <div
          style={{
            marginTop: "35px",
            padding: "20px",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(129,140,248,0.35)",
            borderRadius: "14px",
          }}
        >
          <strong>Admin account:</strong>{" "}
          <span style={{ color: "#cbd5e1" }}>{user?.email}</span>
        </div>
      </div>
    </main>
  );
}
