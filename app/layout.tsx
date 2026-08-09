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
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#081225",
        }}
      >
        <style>{`
          * {
            box-sizing: border-box;
          }

          .launchpad-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 18px 32px;
            background: #0f172a;
            border-bottom: 1px solid #1e293b;
          }

          .launchpad-logo {
            color: white;
            margin: 0;
            font-size: 22px;
            white-space: nowrap;
          }

          .launchpad-nav {
            display: flex;
            align-items: center;
            gap: 22px;
            flex-wrap: wrap;
          }

          .launchpad-nav a {
            color: white;
            text-decoration: none;
            font-size: 16px;
          }

          .launchpad-nav a:hover {
            color: #a78bfa;
          }

          @media (max-width: 700px) {
            .launchpad-header {
              padding: 14px 16px;
              flex-direction: column;
              align-items: flex-start;
              gap: 14px;
            }

            .launchpad-logo {
              font-size: 20px;
            }

            .launchpad-nav {
              width: 100%;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }

            .launchpad-nav a {
              display: block;
              background: #172033;
              border: 1px solid #273449;
              border-radius: 9px;
              padding: 11px 8px;
              text-align: center;
              font-size: 15px;
            }
          }

          @media (max-width: 380px) {
            .launchpad-nav {
              grid-template-columns: 1fr 1fr;
              gap: 8px;
            }

            .launchpad-nav a {
              font-size: 14px;
              padding: 10px 5px;
            }
          }
        `}</style>

        <header className="launchpad-header">
          <h2 className="launchpad-logo">
            🎟️ LaunchPad Tickets
          </h2>

          <nav className="launchpad-nav">
            <Link href="/">Home</Link>

            <Link href="/my-tickets">
              My Tickets
            </Link>

            <Link href="/create-event">
              Create Event
            </Link>

            <Link href="/login">
              Login
            </Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}