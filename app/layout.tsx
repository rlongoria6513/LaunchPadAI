import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "LaunchPad Tickets",
  description: "Browse events and access your LaunchPad tickets",
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
            gap: 14px;
            flex-wrap: wrap;
          }

          .launchpad-nav a {
            color: white;
            text-decoration: none;
            font-size: 15px;
          }

          .nav-link {
            padding: 10px 12px;
            border-radius: 8px;
          }

          .nav-link:hover {
            background: #172033;
            color: #a78bfa;
          }

          .customer-login,
          .customer-register {
            background: #2563eb;
            padding: 10px 14px;
            border-radius: 8px;
            font-weight: bold;
          }

          .promoter-login {
            background: rgba(124, 58, 237, 0.18);
            border: 1px solid rgba(196, 181, 253, 0.42);
            padding: 10px 14px;
            border-radius: 8px;
            font-weight: bold;
          }

          .promoter-apply {
            background: #14b8a6;
            border: 1px solid #5eead4;
            color: #042f2e !important;
            padding: 11px 16px;
            border-radius: 8px;
            font-weight: 800;
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
              text-align: center;
              width: 100%;
            }

            .nav-link,
            .customer-login,
            .customer-register,
            .promoter-login,
            .promoter-apply {
              background: #172033;
              border: 1px solid #273449;
              border-radius: 9px;
              padding: 11px 8px;
            }

            .customer-login,
            .customer-register {
              background: #1d4ed8;
            }

            .promoter-login {
              background: rgba(109, 40, 217, 0.2);
              border-color: rgba(196, 181, 253, 0.42);
            }

            .promoter-apply {
              background: #14b8a6;
              border-color: rgba(94, 234, 212, 0.42);
              color: #042f2e !important;
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
            <Link href="/" className="nav-link">
              Home
            </Link>

            <Link href="/my-tickets" className="nav-link">
              My Tickets
            </Link>

            <Link href="/profile" className="nav-link">
              Profile
            </Link>

            <Link href="/events" className="nav-link">
              Browse Events
            </Link>

            <Link href="/register" className="customer-register">
              Create Account
            </Link>

            <Link href="/login" className="customer-login">
              👤 Customer Login
            </Link>

            <Link
              href="/promoter/apply"
              className="promoter-apply"
            >
              Become a Promoter
            </Link>

            <Link
              href="/promoter-login"
              className="promoter-login"
            >
              🎤 Promoter Login
            </Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
