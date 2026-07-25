import Link from "next/link";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import mysql from "mysql2/promise";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: Date;
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
  );

  await connection.end();

  const users = rows as UserRow[];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ fontSize: "38px" }}>👥 Manage Users</h1>
      <div style={{ marginBottom: "20px" }}>
  <Link
    href="/admin"
    style={{
      color: "#60a5fa",
      textDecoration: "none",
      fontSize: "18px",
    }}
  >
    ← Back to Admin Panel
  </Link>
</div>

      <p style={{ color: "#9ca3af", marginBottom: "30px" }}>
        Total users: {users.length}
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#1f2937",
          }}
        >
          <thead>
            <tr>
              <th style={tableCell}>Name</th>
              <th style={tableCell}>Email</th>
              <th style={tableCell}>Role</th>
              <th style={tableCell}>Joined</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={tableCell}>{user.name}</td>
                <td style={tableCell}>{user.email}</td>
                <td style={tableCell}>{user.role}</td>
                <td style={tableCell}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const tableCell = {
  borderBottom: "1px solid #374151",
  padding: "15px",
  textAlign: "left" as const,
};