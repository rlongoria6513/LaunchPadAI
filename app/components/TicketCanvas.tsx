
type TicketCanvasProps = {
  eventName: string;
  venue: string;
  location: string;
  eventDate: string;
  eventTime: string;
  customerName: string;
  ticketNumber: string;
  flyerUrl?: string;
  ticketColor: string;
};

export default function TicketCanvas({
  eventName,
  venue,
  location,
  eventDate,
  eventTime,
  customerName,
  ticketNumber,
  flyerUrl,
  ticketColor,
}: TicketCanvasProps) {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        paddingBottom: 12,
      }}
    >
      <div
        style={{
          width: 1100,
          minWidth: 1100,
          height: 390,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "300px 1fr 260px",
          background: "#fffdf8",
          color: "#111827",
          border: `4px solid ${ticketColor}`,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.35)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* LEFT IMAGE PANEL */}

        <div
          style={{
            background: "#111827",
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {flyerUrl ? (
            <img
              src={flyerUrl}
              alt={`${eventName} flyer`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 14,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                border: "2px dashed #6b7280",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d1d5db",
                fontWeight: 800,
              }}
            >
              No Flyer
            </div>
          )}
        </div>

        {/* CENTER MAIN TICKET */}

        <div
          style={{
            position: "relative",
            padding: "34px 38px",
            background: "#fffdf8",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 14,
              background: ticketColor,
            }}
          />

          <p
            style={{
              margin: "4px 0 10px",
              color: ticketColor,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 2.5,
              textTransform: "uppercase",
            }}
          >
            LaunchPad AI Presents
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: 38,
              lineHeight: 1.05,
              color: "#111827",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {eventName}
          </h1>

          <p
            style={{
              margin: "10px 0 24px",
              color: ticketColor,
              fontSize: 19,
              fontWeight: 900,
            }}
          >
            VIP ADMISSION
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px 28px",
              padding: "20px 0",
              borderTop: "1px solid #cbd5e1",
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <TicketField label="Date" value={eventDate} />
            <TicketField label="Time" value={eventTime} />
            <TicketField label="Venue" value={venue} />
            <TicketField label="Location" value={location} />
            <TicketField label="Guest" value={customerName} />
            <TicketField label="Ticket Number" value={ticketNumber} />
          </div>

          <p
            style={{
              margin: "22px 0 0",
              color: "#64748b",
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Present this ticket at the entrance • One admission only
          </p>
        </div>

        {/* RIGHT TEAR-OFF STUB */}

        <div
          style={{
            position: "relative",
            padding: "26px 22px",
            background: ticketColor,
            color: "white",
            borderLeft: "4px dashed #fffdf8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -18,
              top: -18,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#1f2937",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: -18,
              bottom: -18,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#1f2937",
            }}
          />

          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Admit One
            </p>

            <h2
              style={{
                margin: "16px 0 6px",
                fontSize: 24,
                lineHeight: 1.1,
                textTransform: "uppercase",
              }}
            >
              {eventName}
            </h2>

            <p style={{ margin: "12px 0 0", fontWeight: 700 }}>
              {eventDate}
            </p>

            <p style={{ margin: "4px 0 0", fontWeight: 700 }}>
              {eventTime}
            </p>
          </div>

          <div
            style={{
              width: 165,
              height: 165,
              background: "white",
              color: "#111827",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            QR CODE
          </div>

          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                opacity: 0.9,
              }}
            >
              Ticket #
            </p>

            <p
              style={{
                margin: "5px 0 0",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {ticketNumber}
            </p>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 11,
              opacity: 0.8,
            }}
          >
            Powered by LaunchPad AI
          </p>
        </div>
      </div>
    </div>
  );
}

function TicketField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <span
        style={{
          display: "block",
          marginBottom: 5,
          color: "#64748b",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          color: "#111827",
          fontSize: 16,
          lineHeight: 1.35,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </strong>
    </div>
  );
}