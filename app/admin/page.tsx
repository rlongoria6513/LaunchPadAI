import Link from "next/link";
import { auth } from "../auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const role = String((user as any)?.role || "").toLowerCase();

if (role !== "admin") {
  redirect("/dashboard");
}

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
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 50%, #1e1b4b 100%)",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
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