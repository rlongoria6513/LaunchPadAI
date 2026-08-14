"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

type CheckedTicket = {
  id: number;
  ticket_number: string;
  event_name?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
};

type ScannerEvent = {
  id: number;
  eventName: string;
};

type CachedTicket = {
  orderId: number;
  ticketNumber: string;
  used: boolean;
};

type QueuedScan = {
  scan_uuid: string;
  event_id: number;
  ticket_number: string;
  device_id: string;
  scanned_at: string;
};

export default function ScannerClient({ events }: { events: ScannerEvent[] }) {
  const [status, setStatus] = useState("");
  const [ticket, setTicket] = useState<CheckedTicket | null>(null);
  const [manualTicketNumber, setManualTicketNumber] = useState("");
  const [checking, setChecking] = useState(false);
  const [scannerError, setScannerError] = useState(getInitialScannerError);
  const checkingRef = useRef(false);
  const [selectedEventId, setSelectedEventId] = useState(
    events[0]?.id ? String(events[0].id) : ""
  );
  const selectedEventIdRef = useRef(selectedEventId);
  const [connectionState, setConnectionState] = useState(() =>
    typeof navigator !== "undefined" && !navigator.onLine
      ? "OFFLINE"
      : "ONLINE"
  );
  const [cachedCount, setCachedCount] = useState(() =>
    typeof window !== "undefined" && events[0]?.id
      ? getCachedTickets(events[0].id).length
      : 0
  );
  const [queuedCount, setQueuedCount] = useState(() =>
    typeof window !== "undefined" ? getQueuedScans().length : 0
  );
  const [deviceId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const existing =
      window.localStorage.getItem("launchpad_scanner_device_id") ||
      crypto.randomUUID();
    window.localStorage.setItem("launchpad_scanner_device_id", existing);
    return existing;
  });

  function updateSelectedEvent(eventId: string) {
    const numericEventId = Number(eventId);

    setSelectedEventId(eventId);
    selectedEventIdRef.current = eventId;
    setCachedCount(
      numericEventId ? getCachedTickets(numericEventId).length : 0
    );
    setQueuedCount(getQueuedScans().length);
  }

  const offlineCheck = useCallback((
    eventId: number,
    ticketNumber: string,
    currentDeviceId: string
  ) => {
    const tickets = getCachedTickets(eventId);
    const target = tickets.find(
      (cachedTicket) => cachedTicket.ticketNumber === ticketNumber
    );

    if (!target) {
      setStatus("INVALID");
      setTicket(null);
      return;
    }

    if (target.used) {
      setStatus("USED");
      setTicket(null);
      return;
    }

    target.used = true;
    window.localStorage.setItem(cacheKey(eventId), JSON.stringify(tickets));
    setCachedCount(tickets.length);

    const queued = getQueuedScans();
    queued.push({
      scan_uuid: crypto.randomUUID(),
      event_id: eventId,
      ticket_number: ticketNumber,
      device_id: currentDeviceId,
      scanned_at: new Date().toISOString(),
    });
    window.localStorage.setItem(
      "launchpad_offline_scans",
      JSON.stringify(queued)
    );

    setQueuedCount(queued.length);
    setStatus("VALID_OFFLINE");
    setTicket({
      id: target.orderId,
      ticket_number: target.ticketNumber,
    });
  }, []);

  const syncQueuedScans = useCallback(async () => {
    const queued = getQueuedScans();

    if (!queued.length || !navigator.onLine) {
      return;
    }

    setConnectionState("SYNCING");

    const response = await fetch("/api/scanner/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scans: queued }),
    });

    if (response.ok) {
      window.localStorage.setItem("launchpad_offline_scans", "[]");
      setQueuedCount(0);
    }

    setConnectionState(navigator.onLine ? "ONLINE" : "OFFLINE");
  }, []);

  useEffect(() => {
    function updateOnlineState() {
      setConnectionState(navigator.onLine ? "ONLINE" : "OFFLINE");

      if (navigator.onLine) {
        void syncQueuedScans();
      }
    }

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, [syncQueuedScans]);

  const checkTicket = useCallback(async (ticketNumber: string) => {
    const trimmedTicketNumber = ticketNumber.trim();
    const eventId = Number(selectedEventIdRef.current);

    if (!trimmedTicketNumber || checkingRef.current || !eventId) {
      return;
    }

    try {
      checkingRef.current = true;
      setChecking(true);

      if (!navigator.onLine) {
        offlineCheck(eventId, trimmedTicketNumber, deviceId);
        return;
      }

      const res = await fetch("/api/check-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketNumber: trimmedTicketNumber,
          eventId,
          deviceId,
          scanUuid: crypto.randomUUID(),
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
      offlineCheck(eventId, trimmedTicketNumber, deviceId);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [deviceId, offlineCheck]);

  async function cacheSelectedEvent() {
    const eventId = Number(selectedEventId);

    if (!eventId) {
      return;
    }

    const response = await fetch(`/api/scanner/cache?eventId=${eventId}`);
    const data = await response.json();

    if (!response.ok) {
      setStatus("ERROR");
      return;
    }

    window.localStorage.setItem(
      cacheKey(eventId),
      JSON.stringify(data.tickets || [])
    );
    setCachedCount((data.tickets || []).length);
  }

  useEffect(() => {
    if (getInitialScannerError()) {
      return;
    }

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

    try {
      scanner.render(
        (decodedText) => {
          void checkTicket(decodedText);
        },
        () => {}
      );
    } catch (error) {
      console.error(error);
      window.setTimeout(
        () =>
          setScannerError(
            "The camera scanner could not start. Check camera permissions, close other camera apps, then reload this page."
          ),
        0
      );
    }

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

        <section
          style={{
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "14px",
            display: "grid",
            gap: "12px",
            marginBottom: "22px",
            padding: "18px",
          }}
        >
          <label style={{ display: "grid", gap: "7px", fontWeight: 700 }}>
            Event
            <select
              value={selectedEventId}
              onChange={(event) => updateSelectedEvent(event.target.value)}
              style={{
                padding: "12px",
                borderRadius: "9px",
                fontSize: "16px",
              }}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
            }}
          >
            <StatusPill label="Status" value={connectionState} />
            <StatusPill label="Cached Tickets" value={cachedCount} />
            <StatusPill label="Queued Scans" value={queuedCount} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "10px",
            }}
          >
            <button type="button" onClick={cacheSelectedEvent} style={buttonStyle}>
              Cache Event Tickets
            </button>
            <button type="button" onClick={syncQueuedScans} style={buttonStyle}>
              Sync Offline Scans
            </button>
          </div>
        </section>

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

            <p
              style={{
                color: "#cbd5e1",
                fontSize: "14px",
                lineHeight: 1.5,
                marginTop: 0,
              }}
            >
              Allow camera access when prompted. On phones, open this page in
              Safari, Chrome, or Edge over HTTPS.
            </p>

            {scannerError ? (
              <div
                role="alert"
                style={{
                  background: "#7f1d1d",
                  border: "1px solid #ef4444",
                  borderRadius: "10px",
                  color: "#fecaca",
                  lineHeight: 1.5,
                  marginBottom: "14px",
                  padding: "12px",
                }}
              >
                {scannerError}
              </div>
            ) : null}

            <div
              id="reader"
              style={{
                width: 420,
                maxWidth: "100%",
                minHeight: "320px",
                overflow: "hidden",
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

      {(status === "VALID" || status === "VALID_OFFLINE") && ticket && (
        <div
          style={{
            marginTop: 40,
            padding: 25,
            borderRadius: 12,
            background: "#14532d",
            border: "2px solid #22c55e",
          }}
        >
          <h2>✅ {status === "VALID_OFFLINE" ? "VALID OFFLINE" : "VALID TICKET"}</h2>

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

function StatusPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "11px",
      }}
    >
      <span style={{ color: "#94a3b8", display: "block", fontSize: "12px" }}>
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function getCachedTickets(eventId: number) {
  try {
    return JSON.parse(
      window.localStorage.getItem(cacheKey(eventId)) || "[]"
    ) as CachedTicket[];
  } catch {
    return [];
  }
}

function getQueuedScans() {
  try {
    return JSON.parse(
      window.localStorage.getItem("launchpad_offline_scans") || "[]"
    ) as QueuedScan[];
  } catch {
    return [];
  }
}

function getInitialScannerError() {
  if (typeof window === "undefined") {
    return "";
  }

  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    return "Camera scanning requires a secure HTTPS page. Open LaunchPad from the live HTTPS site and try again.";
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "This browser cannot access the camera from this page. Use current Safari, Chrome, or Edge and allow camera access.";
  }

  return "";
}

function cacheKey(eventId: number) {
  return `launchpad_cached_tickets_${eventId}`;
}

const buttonStyle = {
  background: "#06b6d4",
  border: 0,
  borderRadius: "9px",
  color: "#082f49",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 800,
  padding: "12px",
};
