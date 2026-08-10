"use client";

export default function ApproveButton({
  requestId,
  email,
}: {
  requestId: number;
  email: string;
}) {
  async function approveRequest() {
    const confirmed = window.confirm(
      `Approve ${email} as a LaunchPad promoter?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/promoter-approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Could not approve promoter."
        );
        return;
      }

      alert("✅ Promoter approved!");
      window.location.reload();
    } catch (error) {
      console.error(
        "Promoter approval error:",
        error
      );

      alert(
        "Something went wrong approving this promoter."
      );
    }
  }

  return (
    <button
      type="button"
      onClick={approveRequest}
      style={{
        width: "100%",
        background: "#16a34a",
        color: "white",
        border: "none",
        padding: "12px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "15px",
      }}
    >
      ✅ Approve Promoter
    </button>
  );
}