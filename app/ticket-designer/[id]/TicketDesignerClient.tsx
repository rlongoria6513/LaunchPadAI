"use client";

import { useState } from "react";

export default function TicketDesignerClient() {
  const [ticketColor, setTicketColor] = useState("#7c3aed");
  const [headerText, setHeaderText] = useState("ADMIT ONE");
  const [customMessage, setCustomMessage] = useState(
    "Thank you for supporting live music!"
  );

  return (
    <div>
      <h2>Ticket Designer Test</h2>

      <label>Ticket Color</label>
      <input
        type="color"
        value={ticketColor}
        onChange={(e) => setTicketColor(e.target.value)}
      />

      <br />
      <br />

      <label>Header Text</label>
      <input
        type="text"
        value={headerText}
        onChange={(e) => setHeaderText(e.target.value)}
      />

      <br />
      <br />

      <label>Custom Message</label>
      <textarea
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
      />

      <div
        style={{
          marginTop: "25px",
          padding: "25px",
          borderRadius: "14px",
          background: ticketColor,
          color: "white",
        }}
      >
        <strong>{headerText}</strong>
        <p>{customMessage}</p>
      </div>
    </div>
  );
}