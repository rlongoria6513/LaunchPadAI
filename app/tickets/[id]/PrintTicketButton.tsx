"use client";

export default function PrintTicketButton() {
  return (
    <button type="button" onClick={() => window.print()}>
      Print Ticket
    </button>
  );
}
