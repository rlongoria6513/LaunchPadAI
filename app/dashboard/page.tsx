import LogoutButton from "./LogoutButton";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();
  const user = session?.user;

  if (!session) {
    redirect("/login");
  }

  const role = String((user as any)?.role || "").toLowerCase();

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .dashboard-main {
          background: #111827;
          min-height: 100vh;
          color: white;
          padding: 40px 20px;
          font-family: Arial, sans-serif;
        }

        .dashboard-wrap {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        .dashboard-title {
          font-size: 42px;
          margin: 0 0 10px;
        }

        .dashboard-welcome {
          margin-bottom: 30px;
          color: #9ca3af;
          font-size: 17px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 20px;
        }

        .dashboard-card {
          background: #1f2937;
          border-radius: 15px;
          padding: 30px 22px;
          text-decoration: none;
          color: white;
          font-size: 21px;
          text-align: center;
          border: 1px solid #374151;
          min-height: 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .dashboard-card small {
          color: #9ca3af;
          margin-top: 8px;
          font-size: 14px;
        }

        .dashboard-top-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }

        .dashboard-action-link {
          display: inline-block;
          text-decoration: none;
          color: white;
          background: #2563eb;
          padding: 11px 16px;
          border-radius: 9px;
          font-weight: bold;
        }

        @media (max-width: 600px) {
          .dashboard-main {
            padding: 24px 12px;
          }

          .dashboard-title {
            font-size: 30px;
            line-height: 1.15;
          }

          .dashboard-welcome {
            font-size: 15px;
            margin-bottom: 22px;
            overflow-wrap: anywhere;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .dashboard-card {
            min-height: 95px;
            padding: 20px 14px;
            font-size: 18px;
          }

          .dashboard-top-actions {
            flex-direction: column;
          }

          .dashboard-action-link {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <main className="dashboard-main">
        <div className="dashboard-wrap">
          <h1 className="dashboard-title">
            🎟️ LaunchPad Tickets
          </h1>

          <p className="dashboard-welcome">
            Welcome, {user?.name || user?.email || "User"} ({role || "customer"})
          </p>

          <div className="dashboard-top-actions">
            {role === "admin" && (
              <Link
                href="/admin"
                className="dashboard-action-link"
              >
                👑 Admin Panel
              </Link>
            )}

            {role === "promoter" && (
              <Link
                href="/promoter"
                className="dashboard-action-link"
              >
                🎤 Promoter Dashboard
              </Link>
            )}

            <Link
              href="/my-tickets"
              className="dashboard-action-link"
            >
              🎟️ My Tickets
            </Link>

            <LogoutButton />
          </div>

          <div className="dashboard-grid">
            {role === "admin" && (
              <Link
                href="/admin"
                className="dashboard-card"
              >
                👑 Admin Panel
                <small>Manage the entire platform</small>
              </Link>
            )}

            {role === "promoter" && (
              <Link
                href="/promoter"
                className="dashboard-card"
              >
                🎤 Promoter Dashboard
                <small>Manage your events and sales</small>
              </Link>
            )}

            <Link
              href="/events"
              className="dashboard-card"
            >
              📅 Events
              <small>Browse and manage events</small>
            </Link>

            <Link
              href="/my-tickets"
              className="dashboard-card"
            >
              🎟️ My Tickets
              <small>View your purchased tickets</small>
            </Link>

            <div className="dashboard-card">
              💰 Ticket Sales
              <small>More reporting coming soon</small>
            </div>

            <div className="dashboard-card">
              👥 Customers
              <small>Customer tools coming soon</small>
            </div>

            <div className="dashboard-card">
              📻 Kaboom Radio
              <small>Coming Soon</small>
            </div>

            <div className="dashboard-card">
              ⚙️ Settings
              <small>Coming Soon</small>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}