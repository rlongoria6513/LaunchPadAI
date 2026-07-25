export function generateTicketNumber() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const random = Math.floor(Math.random() * 900000) + 100000;

  return `LP-${year}${month}${day}-${random}`;
}