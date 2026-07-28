"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteButtonProps = {
  eventId: number;
  eventName: string;
};

export default function DeleteButton({
  eventId,
  eventName,
}: DeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${eventName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete event");
      }

      router.refresh();
    } catch {
      alert("The event could not be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      style={{
        background: deleting ? "#7f1d1d" : "#dc2626",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "10px 18px",
        cursor: deleting ? "not-allowed" : "pointer",
        fontWeight: "bold",
      }}
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}