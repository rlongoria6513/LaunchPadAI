import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "LaunchPad Tickets",
  description: "Create, Promote and Sell Event Tickets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#081225" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 40px",
            background: "#0f172a",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <h2 style={{ color: "white", margin: 0 }}>
            🎟 LaunchPad Tickets
          </h2>

          <nav style={{ display: "flex", gap: "25px" }}>
            <Link href="/" style={{ color: "white", textDecoration: "none" }}>Home</Link>
            <Link href="/create-event" style={{ color: "white", textDecoration: "none" }}>Create Event</Link>
            <Link href="/login" style={{ color: "white", textDecoration: "none" }}>Login</Link>
            <Link href="/register" style={{ color: "white", textDecoration: "none" }}>Register</Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}