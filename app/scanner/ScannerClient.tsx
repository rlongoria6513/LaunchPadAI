"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useCallback, useEffect, useState } from "react";

type CheckedTicket = {
  id: number;
  ticket_number: string;
  event_name?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
};

export default function ScannerClient() {
  const [status, setStatus] = useState("");
  const [ticket, setTicket] = useState<CheckedTicket | null>(null);
  const [manualTicketNumber, setManualTicketNumber] = useState("");
  const [checking, setChecking] = useState(false);

  const checkTicket = useCallback(async (ticketNumber: string) => {
    const trimmedTicketNumber = ticketNumber.trim();

    if (!trimmedTicketNumber || checking) {
      return;
    }

    try {
      setChecking(true);

      const res = await fetch("/api/check-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketNumber: trimmedTicketNumber,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setStatus("VALID");
        setTicket(data.ticket);
        setManualTicketNumber("");
      } else if (data.message === "Ticket already used.") {
        setStatus("USED");
        setTicket(null);
      } else {
        setStatus("INVALID");
        setTicket(null);
      }
    } catch (error) {
      console.error(error);
      setStatus("ERROR");
      setTicket(null);
    } finally {
      setChecking(false);
    }
  }, [checking]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        void checkTicket(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [checkTicket]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        <h1 style={{ color: "#67e8f9", marginTop: 0 }}>
          🎫 LaunchPad AI Ticket Scanner
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "22px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Camera Scan</h2>

            <div
              id="reader"
              style={{
                width: 420,
                maxWidth: "100%",
              }}
            />
          </section>

          <section
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Manual Entry</h2>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void checkTicket(manualTicketNumber);
              }}
              style={{ display: "grid", gap: "12px" }}
            >
              <input
                type="text"
                value={manualTicketNumber}
                onChange={(event) =>
                  setManualTicketNumber(event.target.value)
                }
                placeholder="Enter ticket number"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px",
                  borderRadius: "9px",
                  border: "1px solid #334155",
                  fontSize: "16px",
                }}
              />

              <button
                type="submit"
                disabled={checking}
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "none",
                  borderRadius: "9px",
                  background: checking ? "#64748b" : "#2563eb",
                  color: "white",
                  cursor: checking ? "not-allowed" : "pointer",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {checking ? "Checking..." : "Check Ticket"}
              </button>
            </form>
          </section>
        </div>

      {status === "VALID" && ticket && (
        <div
          style={{
            marginTop: 40,
            padding: 25,
            borderRadius: 12,
            background: "#14532d",
            border: "2px solid #22c55e",
          }}
        >
          <h2>✅ VALID TICKET</h2>

          <p>
            <strong>Ticket #:</strong> {ticket.ticket_number}
          </p>

          {ticket.event_name ? (
            <p>
              <strong>Event:</strong> {ticket.event_name}
            </p>
          ) : null}

          {ticket.customer_name || ticket.customer_email ? (
            <p>
              <strong>Guest:</strong>{" "}
              {ticket.customer_name || ticket.customer_email}
            </p>
          ) : null}

          <p>
            <strong>Order ID:</strong> {ticket.id}
          </p>
        </div>
      )}

      {status === "USED" && (
        <div
          style={{
            marginTop: 40,
            padding: 25,
            borderRadius: 12,
            background: "#78350f",
            border: "2px solid #f59e0b",
          }}
        >
          <h2 style={{ color: "#fbbf24" }}>
            ⚠️ TICKET ALREADY USED
          </h2>

          <p>This ticket has already been checked in.</p>
        </div>
      )}

      {status === "INVALID" && (
        <div
          style={{
            marginTop: 40,
            padding: 25,
            borderRadius: 12,
            background: "#7f1d1d",
            border: "2px solid red",
          }}
        >
          <h2>❌ INVALID TICKET</h2>
        </div>
      )}

      {status === "ERROR" && (
        <div
          style={{
            marginTop: 40,
            padding: 25,
            borderRadius: 12,
            background: "#7f1d1d",
            border: "2px solid red",
          }}
        >
          <h2>⚠️ SCANNER ERROR</h2>
        </div>
      )}
      </div>
    </main>
  );
}
