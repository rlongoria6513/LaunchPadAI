import Link from "next/link";

export default function Home() {
  return (
    <main
      className="home-page"
      style={{
        minHeight: "100vh",
        background: "#081225",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        .home-hero {
          min-height: 720px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          text-align: left;
          padding: 60px;
          background-image: url('/images/hero.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .home-eyebrow {
          color: #67e8f9;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 0 0 12px;
          text-transform: uppercase;
        }

        .home-title {
          font-size: 64px;
          line-height: 1.05;
          margin: 0;
          max-width: 850px;
        }

        .home-subtitle {
          font-size: 24px;
          color: #9ecbff;
          margin: 20px 0 0;
          max-width: 760px;
        }

        .home-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 50px;
          flex-wrap: wrap;
        }

        .home-cta,
        .home-account-cta,
        .home-secondary-cta {
          display: inline-block;
          text-decoration: none;
          text-align: center;
          font-weight: 800;
          border-radius: 12px;
          font-size: 20px;
        }

        .home-cta {
          background: #2563eb;
          color: white;
          padding: 18px 42px;
        }

        .home-account-cta {
          background: #1d4ed8;
          color: white;
          padding: 18px 30px;
        }

        .home-secondary-cta {
          background: rgba(15, 23, 42, 0.84);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: white;
          padding: 17px 26px;
        }

        .home-features {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 25px;
          padding: 100px 80px;
        }

        .home-feature-card {
          background: #101c33;
          padding: 30px;
          border-radius: 15px;
        }

        .home-events-band {
          padding: 0 80px 100px;
        }

        .home-events-panel {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(15, 23, 42, 0.96));
          border: 1px solid rgba(103, 232, 249, 0.28);
          border-radius: 18px;
          padding: 34px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: center;
        }

        .home-events-panel h2 {
          font-size: 34px;
          margin: 0 0 10px;
        }

        .home-events-panel p {
          color: #cbd5e1;
          font-size: 18px;
          line-height: 1.6;
          margin: 0;
          max-width: 680px;
        }

        .home-promoter-note {
          color: #cbd5e1;
          font-size: 14px;
          margin: 30px 0 0;
        }

        .home-promoter-note a {
          color: #c4b5fd;
          font-weight: 800;
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .home-hero {
            min-height: 620px;
            padding: 48px 28px;
          }

          .home-title {
            font-size: 48px;
          }

          .home-subtitle {
            font-size: 21px;
          }

          .home-features {
            grid-template-columns: 1fr;
            padding: 56px 24px;
          }

          .home-events-band {
            padding: 0 24px 64px;
          }

          .home-events-panel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 520px) {
          .home-hero {
            min-height: 520px;
            padding: 36px 18px;
            background-position: center top;
          }

          .home-title {
            font-size: 36px;
          }

          .home-subtitle {
            font-size: 18px;
            line-height: 1.5;
          }

          .home-actions {
            width: 100%;
            gap: 10px;
          }

          .home-cta,
          .home-account-cta,
          .home-secondary-cta {
            width: 100%;
            padding: 15px 16px;
            font-size: 18px;
          }

          .home-feature-card {
            padding: 22px;
          }

          .home-events-panel {
            padding: 24px 18px;
          }

          .home-events-panel h2 {
            font-size: 27px;
          }

          .home-events-panel p {
            font-size: 16px;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="home-hero">
        <p className="home-eyebrow">LaunchPad Tickets</p>

        <h1 className="home-title">Find Your Next Live Event</h1>

        <p className="home-subtitle">
          Browse upcoming concerts, festivals, comedy nights, sports,
          and community events. Buy securely and keep your QR tickets
          ready when you arrive.
        </p>

        <div className="home-actions">
          <Link href="/events" className="home-cta">
            Browse Events
          </Link>

          <Link href="/register" className="home-account-cta">
            Create Account
          </Link>

          <Link href="/my-tickets" className="home-secondary-cta">
            My Tickets
          </Link>
        </div>

        <p className="home-promoter-note">
          Promoter or venue team?{" "}
          <Link href="/promoter-login">Go to Promoter Login</Link>
        </p>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-feature-card">
          <h2>🎫 Browse Events</h2>
          <p>Find upcoming shows and live experiences in one place.</p>
        </div>

        <div className="home-feature-card">
          <h2>📱 Mobile Tickets</h2>
          <p>Get QR tickets you can open from your phone at the door.</p>
        </div>

        <div className="home-feature-card">
          <h2>✅ Easy Access</h2>
          <p>Use My Tickets to find your purchases when you need them.</p>
        </div>
      </section>

      <section className="home-events-band">
        <div className="home-events-panel">
          <div>
            <h2>Upcoming Events Are Waiting</h2>
            <p>
              Start with the event list, choose the experience you want,
              and check out with secure ticket delivery.
            </p>
          </div>

          <Link href="/events" className="home-cta">
            View Upcoming Events
          </Link>
        </div>
      </section>
    </main>
  );
}
