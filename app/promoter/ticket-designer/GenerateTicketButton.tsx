"use client";

export default function GenerateTicketButton() {
  function generateTicket() {
    const ticket = document.getElementById("printable-ticket");

    if (!ticket) {
      alert("Ticket preview could not be found.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=800");

    if (!printWindow) {
      alert("Please allow pop-ups so the ticket can be generated.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LaunchPad AI Ticket</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 30px;
              background: white;
              display: flex;
              justify-content: center;
              font-family: Arial, sans-serif;
            }

            #ticket-print-area {
              width: fit-content;
            }

            @page {
              size: landscape;
              margin: 10mm;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <div id="ticket-print-area">
            ${ticket.innerHTML}
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <button
      type="button"
      onClick={generateTicket}
      style={{
        width: "100%",
        background: "#16a34a",
        color: "white",
        border: "none",
        padding: "12px 16px",
        borderRadius: 9,
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 800,
      }}
    >
      Generate Ticket
    </button>
  );
}