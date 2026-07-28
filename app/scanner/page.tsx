"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";

export default function ScannerPage() {
  const [status, setStatus] = useState("");
  const [ticket, setTicket] = useState<any>(null);

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
      async (decodedText) => {
        try {
          const res = await fetch("/api/check-ticket", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ticketNumber: decodedText,
            }),
          });

          const data = await res.json();

          if (data.valid) {
            setStatus("VALID");
            setTicket(data.ticket);
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
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: 40,
        fontFamily: "Arial",
      }}
    >
      <h1 style={{ color: "#67e8f9" }}>
        🎫 LaunchPad AI Ticket Scanner
      </h1>

      <div
        id="reader"
        style={{
          width: 420,
          maxWidth: "100%",
          marginTop: 30,
        }}
      />

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
    </main>
  );
}