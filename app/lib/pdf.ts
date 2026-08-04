import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export async function generateTicketPDF({
  customerName,
  eventName,
  ticketNumber,
  imageUrl,
  qrCode,
  venue,
  eventDate,
  eventTime,
}: {
  customerName: string;
  eventName: string;
  ticketNumber: string;
  imageUrl?: string;
  qrCode?: string;
  venue?: string;
  eventDate?: string;
  eventTime?: string;
}): Promise<Buffer> {
 
  const pdfDoc = await PDFDocument.create();
  let qrImage;

if (qrCode) {
  const base64 = qrCode.split(",")[1];
  const qrBytes = Buffer.from(base64, "base64");
  qrImage = await pdfDoc.embedPng(qrBytes);
}
  

  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let flyerImage;
  if (imageUrl) {
    
  const response = await fetch(imageUrl);
  const imageBytes = new Uint8Array(await response.arrayBuffer());
  flyerImage = await pdfDoc.embedPng(imageBytes);
}
  
  page.drawRectangle({
  x: 0,
  y: 710,
  width: 612,
  height: 82,
  color: rgb(0.04, 0.10, 0.22),
});
if (flyerImage) {
  page.drawImage(flyerImage, {
    x: 70,
    y: 505,
    width: 470,
    height: 140,
  });
}
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("LaunchPad AI", {
    x: 150,
    y: 735,
    size: 34,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText("EVENT TICKET", {
    x: 175,
    y: 680,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
  start: { x: 50, y: 460 },
  end: { x: 562, y: 460 },
  thickness: 2,
  color: rgb(0.85, 0.85, 0.85),
});
  page.drawText("TICKET DETAILS", {
  x: 70,
  y: 480,
  size: 18,
  font: boldFont,
  color: rgb(0.05, 0.65, 0.9),
});
page.drawText(`Customer: ${customerName}`, {
    x: 70,
    y: 440,
    size: 16,
    font: regularFont,
  });

  page.drawLine({
  start: { x: 70, y: 420 },
  end: { x: 540, y: 420 },
  thickness: 1,
  color: rgb(0.9, 0.9, 0.9),
});
  page.drawText(`Event: ${eventName}`, {
    x: 70,
    y: 400,
    size: 16,
    font: regularFont,
  });

  page.drawText(`Ticket #: ${ticketNumber}`, {
    x: 70,
    y: 360,
    size: 16,
    font: regularFont,
  });
  page.drawText(`Venue: ${venue}`, {
  x: 70,
  y: 330,
  size: 16,
  font: regularFont,
});
page.drawText(`Date: ${eventDate}`, {
  x: 70,
  y: 300,
  size: 16,
  font: regularFont,
});
page.drawText(`Time: ${eventTime}`, {
  x: 70,
  y: 270,
  size: 16,
  font: regularFont,
});

  page.drawText(
    "Present the QR code from your email at the entrance for admission.",
    {
      x: 80,
      y: 230,
      size: 13,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    }
  );
  if (qrImage) {
  page.drawImage(qrImage, {
    x: width - 180,
    y: 60,
    width: 140,
    height: 140,
  });
}

  page.drawText("Thank you for using LaunchPad AI.", {
    x: 180,
    y: 25,
    size: 14,
    font: boldFont,
    color: rgb(0.05, 0.65, 0.9),
  });

  const pdfBytes = await pdfDoc.save();

  return Buffer.from(pdfBytes);
}