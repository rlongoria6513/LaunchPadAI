import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2";
import ProfileForm from "./ProfileForm";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  created_at: string | Date | null;
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const sessionUser = session.user as SessionUser | undefined;
  const role = String(sessionUser?.role || "").toLowerCase();

  if (role !== "customer") {
    redirect("/dashboard");
  }

  const userId = Number(sessionUser?.id || 0);

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect("/login");
  }

  const [rows] = await db.execute<UserRow[]>(
    `
    SELECT
      id,
      name,
      email,
      phone,
      role,
      created_at
    FROM users
    WHERE id = ? AND role = 'customer'
    LIMIT 1
    `,
    [userId]
  );

  const user = rows[0];

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="profile-page">
      <style>{`
        .profile-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, 0.22), transparent 34%),
            linear-gradient(135deg, #07111f 0%, #111827 55%, #172554 100%);
          color: white;
          font-family: Arial, sans-serif;
          padding: 42px 20px 72px;
        }

        .profile-shell {
          margin: 0 auto;
          max-width: 1080px;
          width: 100%;
        }

        .profile-header {
          display: grid;
          gap: 10px;
          margin-bottom: 24px;
        }

        .profile-eyebrow {
          color: #67e8f9;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 0;
          text-transform: uppercase;
        }

        .profile-header h1 {
          font-size: clamp(32px, 8vw, 44px);
          line-height: 1.08;
          margin: 0;
        }

        .profile-header p {
          color: #cbd5e1;
          line-height: 1.5;
          margin: 0;
          overflow-wrap: anywhere;
        }

        .profile-summary {
          background: rgba(15, 23, 42, 0.84);
          border: 1px solid rgba(148, 163, 184, 0.26);
          border-radius: 18px;
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 22px;
          padding: 22px;
        }

        .profile-summary-item {
          min-width: 0;
        }

        .profile-summary-item span {
          color: #94a3b8;
          display: block;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .profile-summary-item strong {
          color: #f8fafc;
          display: block;
          font-size: 16px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .profile-actions {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-bottom: 22px;
        }

        .profile-action-link {
          background: #2563eb;
          border-radius: 12px;
          color: white;
          display: block;
          font-weight: 800;
          padding: 15px 18px;
          text-align: center;
          text-decoration: none;
        }

        .profile-action-link.secondary {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .profile-form-grid {
          display: grid;
          gap: 22px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .profile-panel {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.26);
          border-radius: 18px;
          display: grid;
          gap: 16px;
          padding: 24px;
        }

        .profile-panel h2 {
          font-size: 24px;
          margin: 0;
        }

        .profile-field {
          display: grid;
          gap: 7px;
        }

        .profile-field span {
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 800;
        }

        .profile-field input {
          background: #020617;
          border: 1px solid #334155;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          min-height: 48px;
          padding: 12px 13px;
          width: 100%;
        }

        .profile-panel button {
          background: #06b6d4;
          border: 0;
          border-radius: 10px;
          color: #082f49;
          cursor: pointer;
          font-size: 16px;
          font-weight: 800;
          min-height: 48px;
          padding: 12px 16px;
          width: 100%;
        }

        .profile-panel button:disabled {
          background: #64748b;
          color: white;
          cursor: not-allowed;
        }

        .profile-message {
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.45;
          margin: 0;
          padding: 11px 12px;
        }

        .profile-message.error {
          background: rgba(220, 38, 38, 0.18);
          border: 1px solid rgba(248, 113, 113, 0.45);
          color: #fecaca;
        }

        .profile-message.success {
          background: rgba(22, 163, 74, 0.18);
          border: 1px solid rgba(74, 222, 128, 0.45);
          color: #bbf7d0;
        }

        @media (max-width: 760px) {
          .profile-page {
            padding: 30px 12px 56px;
          }

          .profile-summary,
          .profile-actions,
          .profile-form-grid {
            grid-template-columns: 1fr;
          }

          .profile-summary,
          .profile-panel {
            border-radius: 15px;
            padding: 18px;
          }
        }
      `}</style>

      <div className="profile-shell">
        <header className="profile-header">
          <p className="profile-eyebrow">Customer Profile</p>
          <h1>Account Settings</h1>
          <p>
            Signed in as {user.email}. Manage your customer account details
            and password.
          </p>
        </header>

        <section className="profile-summary" aria-label="Account information">
          <div className="profile-summary-item">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>

          <div className="profile-summary-item">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>

          <div className="profile-summary-item">
            <span>Account Created</span>
            <strong>{formatDate(user.created_at)}</strong>
          </div>
        </section>

        <nav className="profile-actions" aria-label="Customer account links">
          <Link href="/my-tickets" className="profile-action-link">
            My Tickets
          </Link>

          <Link
            href="/order-history"
            className="profile-action-link secondary"
          >
            Order History
          </Link>
        </nav>

        <ProfileForm
          initialName={user.name}
          initialPhone={user.phone || ""}
        />
      </div>
    </main>
  );
}

function formatDate(dateValue: string | Date | null) {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
