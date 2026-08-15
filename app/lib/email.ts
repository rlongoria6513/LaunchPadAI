import nodemailer from "nodemailer";

const emailPort = Number(process.env.EMAIL_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,

  // Port 465 = secure TLS immediately
  // Port 587 = STARTTLS
  secure: emailPort === 465,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendTicketEmail({
  to,
  name,
  eventName,
  ticketNumber,
  qrCode,
  imageUrl,
  pdf,
  mobileTicketUrl,
}: {
  to: string;
  name: string;
  eventName: string;
  ticketNumber: string;
  qrCode: string;
  imageUrl?: string;
  pdf?: Buffer;
  mobileTicketUrl?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"LaunchPad AI" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎟️ Your Ticket for ${eventName}`,

      attachments: pdf
        ? [
            {
              filename: `${ticketNumber}.pdf`,
              content: pdf,
              contentType: "application/pdf",
            },
          ]
        : [],

      html: `
        <div style="
          background:#f3f4f6;
          padding:30px 15px;
          font-family:Arial,sans-serif;
        ">
          <div style="
            max-width:700px;
            margin:0 auto;
            background:#081225;
            border-radius:20px;
            overflow:hidden;
            color:white;
          ">

            ${
              imageUrl
                ? `
                  <img
                    src="${imageUrl}"
                    alt="${eventName}"
                    style="
                      width:100%;
                      max-height:280px;
                      object-fit:cover;
                      display:block;
                    "
                  />
                `
                : ""
            }

            <div style="padding:30px 20px;">

              <h1 style="
                margin:0 0 20px;
                color:#38bdf8;
                font-size:36px;
              ">
                🎟️ LaunchPad AI
              </h1>

              <p style="font-size:18px;">
                Thank you for your purchase,
                <strong>${name}</strong>!
              </p>

              <hr
                style="
                  border:none;
                  border-top:1px solid #334155;
                  margin:25px 0;
                "
              />

              <p>
                <strong>Event:</strong>
                ${eventName}
              </p>

              <p style="overflow-wrap:anywhere;">
                <strong>Ticket #:</strong>
                ${ticketNumber}
              </p>

              <div style="
                text-align:center;
                margin:30px 0;
              ">
                <img
                  src="${qrCode}"
                  alt="Ticket QR Code"
                  style="
                    width:100%;
                    max-width:260px;
                    background:white;
                    padding:12px;
                    border-radius:12px;
                  "
                />
              </div>

              <p>
                Show this QR code at the entrance.
              </p>

              ${
                mobileTicketUrl
                  ? `<p style="text-align:center;margin:24px 0;"><a href="${mobileTicketUrl}" style="display:inline-block;background:#22c55e;color:white;text-decoration:none;font-weight:bold;padding:14px 20px;border-radius:10px;">Open all mobile tickets</a></p>`
                  : ""
              }

              ${
                pdf
                  ? `
                    <p>
                      Your printable ticket is also attached
                      to this email as a PDF.
                    </p>
                  `
                  : ""
              }

              <p style="
                margin-top:30px;
                color:#94a3b8;
                font-size:13px;
              ">
                Sent automatically by LaunchPad AI
              </p>

            </div>
          </div>
        </div>
      `,
    });

    console.log(
      "✅ Ticket email sent:",
      info.messageId
    );

    return info;
  } catch (error) {
    console.error(
      "❌ Ticket email failed:",
      error
    );

    throw error;
  }
}
