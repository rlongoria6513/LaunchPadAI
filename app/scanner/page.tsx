"use client"

import { useEffect, useState } from "react";

export default function ScannerPage() {
  const [ticket, setTicket] = useState("");
  const [status, setStatus] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!scanning) return;

    let scanner: any;
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (cancelled) return;

        scanner = new Html5Qrcode("reader");

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            
          },
          async (decodedText: string) => {
            setTicket(decodedText);
            setScanning(false);

            if (scanner?.isScanning) {
  await scanner.stop();
}
await checkTicket(decodedText);
          },
          () => {}
        );
      } catch (error: any) {
        setStatus(
          `❌ Camera could not start: ${error?.message || "Unknown camera error."}`
        );
        setScanning(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;

      if (scanner?.isScanning) {
  scanner.stop().catch(() => {});
}
    };
  }, [scanning]);

  async function checkTicket(scannedTicket?: string) {
    const cleanTicket = (scannedTicket || ticket).trim();

    if (cleanTicket === "") {
      setStatus("❌ Please enter or scan a ticket number.");
      return;
    }

    try {
      const res = await fetch("/api/check-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketNumber: cleanTicket,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (data.valid) {
        setStatus(
          `🟢 VALID TICKET

Event: ${data.ticket.event_name}

Customer: ${data.ticket.customer_name}

Status: ${data.ticket.payment_status}`
        );
      } else {
        setStatus(`❌ ${data.message || "Ticket not found."}`);
      }
    } catch (error: any) {
      setStatus(
        `❌ Could not check ticket: ${error?.message || "Unknown error."}`
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#1b1b1b",
          padding: "30px",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h1>🎫 LaunchPad AI Scanner</h1>

        <p>Scan or enter a ticket number.</p>

        <input
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          placeholder="Ticket Number"
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "18px",
            marginTop: "20px",
            borderRadius: "8px",
            border: "none",
            color: "black",
            background: "white",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={() => {
            setStatus("");
            setScanning(true);
          }}
          disabled={scanning}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "16px",
            background: scanning ? "#4b5563" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "20px",
            cursor: scanning ? "not-allowed" : "pointer",
          }}
        >
          {scanning ? "Opening Camera..." : "Scan QR Code"}
        </button>

        {scanning && (
          <div
            id="reader"
            style={{
              width: "100%",
              marginTop: "20px",
              overflow: "hidden",
              borderRadius: "10px",
            }}
          />
        )}

        <button
          onClick={() => checkTicket()}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "16px",
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          Check Ticket
        </button>

        {status && (
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              background: "#2a2a2a",
              borderRadius: "10px",
              fontSize: "22px",
              whiteSpace: "pre-line",
            }}
          >
            {status}
          </div>
        )}
      </div>
    </main>
  );
}