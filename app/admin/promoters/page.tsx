import ApproveButton from "./ApproveButton";
import mysql from "mysql2/promise";
import { auth } from "../../auth";
import { redirect } from "next/navigation";

export default async function PromotersPage() {
    const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const [requests] = await connection.execute(
  `
  SELECT
    promoter_requests.id,
    promoter_requests.status,
    promoter_requests.requested_at,
    users.name,
    users.email
  FROM promoter_requests
  JOIN users
    ON promoter_requests.user_id = users.id
  WHERE promoter_requests.status = 'pending'
  ORDER BY promoter_requests.requested_at DESC
  `
);
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

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
      <h1>🎤 Promoter Approval Center</h1>

      <div style={{ color: "#9ca3af", marginTop: "20px" }}>
        {(requests as any[]).length === 0 ? (
  <p>No pending promoter requests.</p>
) : (
  <table>
    <thead>
      <tr>
  <th>Name</th>
  <th>Email</th>
  <th>Requested</th>
  <th>Action</th>
</tr>
    </thead>
    <tbody>
      {(requests as any[]).map((request) => (
        <tr key={request.id}>
          <td>{request.name}</td>
          <td>{request.email}</td>
          <td>
            {new Date(request.requested_at).toLocaleString()}
          </td>
          <td>
 <ApproveButton requestId={request.id} />
</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
      </div>
    </main>
  );
}