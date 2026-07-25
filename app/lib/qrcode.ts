import QRCode from "qrcode";

export async function generateQRCode(ticketNumber: string) {
  return await QRCode.toDataURL(ticketNumber, {
    width: 300,
    margin: 2,
  });
}