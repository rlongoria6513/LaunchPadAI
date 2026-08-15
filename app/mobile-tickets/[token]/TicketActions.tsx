"use client";

import { useEffect } from "react";

export default function TicketActions({ autoPrint = false }: { autoPrint?: boolean }) {
  useEffect(() => { if (autoPrint) window.setTimeout(() => window.print(), 250); }, [autoPrint]);
  return <div className="mobile-ticket-actions">
    <button onClick={() => window.print()}>Print Tickets</button>
    <button onClick={() => navigator.clipboard.writeText(window.location.href.split("?")[0])}>Copy Secure Link</button>
  </div>;
}
