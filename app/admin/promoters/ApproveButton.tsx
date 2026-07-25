"use client";

export default function ApproveButton({
  requestId,
}: {
  requestId: number;
}) {
  async function approveRequest() {
    await fetch("/api/admin/promoter-approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId }),
    });

    window.location.reload();
  }

  return (
    <button
      onClick={approveRequest}
      style={{
        background: "#16a34a",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      Approve
    </button>
  );
}