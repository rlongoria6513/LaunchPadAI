import ApproveButton from "./ApproveButton";
import { auth } from "../../auth";
import { redirect } from "next/navigation";
import db from "@/app/lib/db";

export default async function PromotersPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "admin") {
    redirect("/dashboard");
  }

  const [requests]: any = await db.execute(`
    SELECT
      id,
      name,
      email,
      business_name,
      phone,
      city,
      description,
      status,
      created_at
    FROM promoter_requests
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 55%, #312e81 100%)",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <p
            style={{
              color: "#c4b5fd",
              textTransform: "uppercase",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "2px",
              marginBottom: "8px",
            }}
          >
            Administration
          </p>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "36px",
            }}
          >
            🎤 Promoter Approval Center
          </h1>

          <p
            style={{
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Review and approve people who want to sell tickets on LaunchPad.
          </p>
        </div>

        {requests.length === 0 ? (
          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "16px",
              padding: "30px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            ✅ No pending promoter applications.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {requests.map((request: any) => (
              <div
                key={request.id}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <h2
                      style={{
                        margin: "0 0 5px",
                        fontSize: "24px",
                      }}
                    >
                      {request.business_name}
                    </h2>

                    <div
                      style={{
                        color: "#cbd5e1",
                        marginBottom: "16px",
                      }}
                    >
                      {request.name}
                    </div>

                    <div style={infoStyle}>
                      <strong>Email:</strong> {request.email}
                    </div>

                    <div style={infoStyle}>
                      <strong>Phone:</strong>{" "}
                      {request.phone || "Not provided"}
                    </div>

                    <div style={infoStyle}>
                      <strong>City / Market:</strong> {request.city}
                    </div>

                    <div style={{ marginTop: "16px" }}>
                      <strong>About their events:</strong>

                      <p
                        style={{
                          color: "#cbd5e1",
                          lineHeight: "1.6",
                          marginBottom: 0,
                        }}
                      >
                        {request.description}
                      </p>
                    </div>

                    <div
                      style={{
                        color: "#94a3b8",
                        marginTop: "16px",
                        fontSize: "13px",
                      }}
                    >
                      Applied:{" "}
                      {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: "190px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(245,158,11,0.15)",
                        border: "1px solid rgba(245,158,11,0.4)",
                        color: "#fde68a",
                        borderRadius: "999px",
                        padding: "7px 12px",
                        textAlign: "center",
                        marginBottom: "14px",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      ⏳ Pending
                    </div>

                    <ApproveButton
                      requestId={request.id}
                      email={request.email}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const infoStyle = {
  color: "#cbd5e1",
  marginTop: "8px",
};