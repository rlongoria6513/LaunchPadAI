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

        .home-cta {
          margin-top: 50px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 18px 45px;
          border-radius: 12px;
          font-size: 22px;
          cursor: pointer;
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

          .home-cta {
            width: 100%;
            padding: 15px 18px;
            font-size: 18px;
          }

          .home-feature-card {
            padding: 22px;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="home-hero">
        <h1 className="home-title">Sell Event Tickets with AI</h1>

        <p className="home-subtitle">
          Concerts • Festivals • Comedy • Sports • Conferences
        </p>

        <Link href="/create-event">
          <button className="home-cta">
            Create My Event
          </button>
        </Link>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-feature-card">
          <h2>🎫 Ticket Sales</h2>
          <p>Sell unlimited tickets online.</p>
        </div>

        <div className="home-feature-card">
          <h2>🤖 AI Promotion</h2>
          <p>Create advertisements instantly.</p>
        </div>

        <div className="home-feature-card">
          <h2>📱 QR Check-In</h2>
          <p>Scan tickets from any phone.</p>
        </div>
      </section>
    </main>
  );
}
