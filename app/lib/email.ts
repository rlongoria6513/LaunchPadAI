import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
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
}: {
  to: string;
  name: string;
  eventName: string;
  ticketNumber: string;
  qrCode: string;
  imageUrl?: string;
  pdf?: Buffer;
}) {
  await transporter.sendMail({
    from: `"LaunchPad AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your Ticket for ${eventName}`,

    attachments: pdf
      ? [
          {
            filename: `${ticketNumber}.pdf`,
            content: pdf,
          },
        ]
      : [],

    html: `
      <div style="background:#f3f4f6;padding:30px;font-family:Arial,sans-serif;">
        <div style="max-width:700px;margin:0 auto;background:#081225;border-radius:20px;overflow:hidden;color:white;">

          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${eventName}" style="width:100%;max-height:280px;object-fit:cover;display:block;" />`
              : ""
          }

          <div style="padding:35px;">
            <h1 style="margin:0 0 20px 0;color:#38bdf8;font-size:42px;">
              🎟 LaunchPad AI
            </h1>

            <p style="font-size:20px;">
              Thank you for your purchase,
              <strong>${name}</strong>!
            </p>

            <hr>

            <p><strong>Event:</strong> ${eventName}</p>

            <p><strong>Ticket #:</strong> ${ticketNumber}</p>

            <div style="text-align:center;margin:30px 0;">
              <img
                src="${qrCode}"
                style="width:260px;background:white;padding:12px;border-radius:12px;"
              />
            </div>

            <p>
              Your printable ticket is attached as a PDF.
            </p>

            <small style="color:#94a3b8">
              Sent automatically by LaunchPad AI
            </small>
          </div>
        </div>
      </div>
    `,
  });
}