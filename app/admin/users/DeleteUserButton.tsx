"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteUserButtonProps = {
  userId: number;
  name: string;
  email: string;
  role: string;
};

export default function DeleteUserButton({
  userId,
  name,
  email,
  role,
}: DeleteUserButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deleteUser() {
    const confirmed = window.confirm(
      `Delete ${name || email} (${role})?\n\nThis removes only the user login account. Orders, tickets, payments, and event records will be preserved.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Could not delete this user.");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Delete user error:", error);
      alert("Something went wrong deleting this user.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={deleteUser}
      disabled={deleting}
      style={{
        background: deleting ? "#6b7280" : "#dc2626",
        color: "white",
        border: "none",
        padding: "10px 13px",
        borderRadius: "8px",
        cursor: deleting ? "not-allowed" : "pointer",
        fontWeight: "bold",
      }}
    >
      {deleting ? "Deleting..." : "Delete User"}
    </button>
  );
}
