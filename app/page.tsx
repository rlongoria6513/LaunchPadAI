import Link from "next/link";
import { getBrandingSettings } from "@/app/lib/branding";
import PlacedVideo from "@/app/components/PlacedVideo";
import { getActiveVideoPlacement } from "@/app/lib/videoPlacements";
import HomeMotion from "@/app/components/HomeMotion";

const promoterTools = [
  {
    icon: "🎟️",
    title: "Online ticket sales",
    text: "Publish paid or free event listings and let buyers check out online.",
  },
  {
    icon: "💵",
    title: "Door cash/card sales",
    text: "Sell legitimate tickets from a phone or box-office screen at the entrance.",
  },
  {
    icon: "✅",
    title: "QR ticket scanning",
    text: "Scan tickets at the door with LaunchPad validation and used-ticket protection.",
  },
  {
    icon: "📶",
    title: "Offline scanner support",
    text: "Cache event tickets before showtime and keep scanning when connection drops.",
  },
  {
    icon: "🎁",
    title: "Comp and free tickets",
    text: "Issue comps and support free registrations without weakening validation.",
  },
  {
    icon: "🧾",
    title: "Merchandise/register tools",
    text: "Track merch sales, door sales, totals, and transactions separately from tickets.",
  },
  {
    icon: "📊",
    title: "Event-day reports",
    text: "See ticket sales, check-ins, revenue totals, and register summaries in one place.",
  },
  {
    icon: "🏦",
    title: "Stripe Connect payouts",
    text: "Approved promoters can complete payout onboarding securely through Stripe.",
  },
  {
    icon: "🎨",
    title: "Ticket Design Studio",
    text: "Customize ticket presentation while preserving QR and ticket-number validation.",
  },
];

const promoterSteps = [
  "Apply",
  "Get Approved",
  "Create Event",
  "Sell Tickets",
  "Run Event Day",
  "Get Paid",
];

export default async function Home() {
  const [branding, heroVideo, promoterVideo, featuredVideo] = await Promise.all([
    getBrandingSettings(),
    getActiveVideoPlacement("homepage-hero"),
    getActiveVideoPlacement("become-promoter"),
    getActiveVideoPlacement("featured-events"),
  ]);

  return (
    <main
      className="home-page"
      data-home-motion
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        .home-page a {
          color: inherit;
        }

        .home-hero {
          position: relative;
          isolation: isolate;
          min-height: 690px;
          display: flex;
          align-items: center;
          padding: 70px 64px;
          background-image:
            linear-gradient(90deg, rgba(7, 17, 31, 0.94) 0%, rgba(7, 17, 31, 0.78) 48%, rgba(7, 17, 31, 0.46) 100%),
            url('/images/hero.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          overflow: hidden;
        }

        .home-hero::before {
          animation: home-glow-drift 16s ease-in-out infinite alternate;
          background:
            radial-gradient(circle at 35% 45%, rgba(45, 212, 191, 0.22), transparent 42%),
            radial-gradient(circle at 72% 28%, rgba(59, 130, 246, 0.2), transparent 38%);
          content: "";
          inset: -18%;
          pointer-events: none;
          position: absolute;
          transform: translate3d(-2%, 1%, 0) scale(1);
          z-index: 1;
        }

        .home-hero-content {
          max-width: 900px;
          position: relative;
          z-index: 2;
        }

        .home-eyebrow {
          animation: hero-fade-rise 650ms ease-out 80ms both;
          color: #5eead4;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 0 0 14px;
          text-transform: uppercase;
        }

        .home-title {
          animation: hero-fade-rise 750ms cubic-bezier(0.22, 1, 0.36, 1) 170ms both;
          font-size: 68px;
          line-height: 1.03;
          margin: 0;
          max-width: 900px;
        }

        .home-subtitle {
          animation: hero-fade-rise 750ms cubic-bezier(0.22, 1, 0.36, 1) 280ms both;
          color: #dbeafe;
          font-size: 23px;
          line-height: 1.5;
          margin: 22px 0 0;
          max-width: 820px;
        }

        .home-actions,
        .section-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 34px;
        }

        .home-hero .home-actions,
        .home-customer-note {
          animation: hero-fade-rise 700ms ease-out 390ms both;
        }

        .home-cta,
        .home-secondary-cta,
        .home-link-cta {
          border-radius: 12px;
          display: inline-block;
          font-size: 18px;
          font-weight: 800;
          min-height: 52px;
          padding: 16px 28px;
          text-align: center;
          text-decoration: none;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, filter 180ms ease;
        }

        .home-cta:hover,
        .home-secondary-cta:hover,
        .home-link-cta:hover {
          filter: brightness(1.06);
          transform: translateY(-2px);
        }

        .home-cta:hover {
          box-shadow: 0 10px 30px rgba(20, 184, 166, 0.24);
        }

        .home-secondary-cta:hover {
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.24);
        }

        .home-link-cta:hover {
          border-color: rgba(255, 255, 255, 0.42);
        }

        .home-cta {
          background: #14b8a6;
          color: #042f2e;
        }

        .home-secondary-cta {
          background: rgba(37, 99, 235, 0.92);
          color: white;
        }

        .home-link-cta {
          background: rgba(15, 23, 42, 0.86);
          border: 1px solid rgba(255, 255, 255, 0.24);
          color: white;
        }

        .home-customer-note {
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.6;
          margin: 26px 0 0;
        }

        .home-customer-note a {
          color: #93c5fd;
          font-weight: 800;
          text-decoration: none;
        }

        .home-section {
          padding: 86px 72px;
        }

        .home-section.alt {
          background: #0f1f25;
        }

        .section-inner {
          margin: 0 auto;
          max-width: 1180px;
        }

        .section-kicker {
          color: #5eead4;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 0 0 10px;
          text-transform: uppercase;
        }

        .section-heading {
          font-size: 42px;
          line-height: 1.1;
          margin: 0;
          max-width: 780px;
        }

        .section-copy {
          color: #cbd5e1;
          font-size: 18px;
          line-height: 1.7;
          margin: 18px 0 0;
          max-width: 820px;
        }

        .tool-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 34px;
        }

        .tool-card {
          background: #101c33;
          border: 1px solid rgba(148, 163, 184, 0.26);
          border-radius: 8px;
          min-height: 190px;
          padding: 24px;
          transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
        }

        .tool-card:hover {
          border-color: rgba(94, 234, 212, 0.46);
          box-shadow: 0 16px 40px rgba(2, 8, 23, 0.24);
          transform: translateY(-3px);
        }

        .tool-icon {
          animation: accent-float 5s ease-in-out infinite;
          font-size: 30px;
          margin-bottom: 14px;
        }

        .tool-card h3 {
          font-size: 20px;
          margin: 0 0 10px;
        }

        .tool-card p {
          color: #cbd5e1;
          line-height: 1.55;
          margin: 0;
        }

        .steps {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          margin-top: 34px;
        }

        .step {
          background: rgba(20, 184, 166, 0.12);
          border: 1px solid rgba(94, 234, 212, 0.34);
          border-radius: 8px;
          min-height: 94px;
          padding: 18px;
        }

        .step-number {
          color: #5eead4;
          display: block;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .step strong {
          display: block;
          font-size: 18px;
          line-height: 1.25;
        }

        .feature-band {
          align-items: center;
          display: grid;
          gap: 34px;
          grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
        }

        .feature-panel {
          background: #122436;
          border: 1px solid rgba(96, 165, 250, 0.3);
          border-radius: 8px;
          padding: 30px;
        }

        .feature-panel ul {
          color: #dbeafe;
          display: grid;
          gap: 12px;
          line-height: 1.55;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .feature-panel li {
          background: rgba(255, 255, 255, 0.06);
          border-left: 4px solid #14b8a6;
          padding: 12px 14px;
        }

        .customer-band {
          background: #101c33;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
        }

        .reveal-ready [data-home-reveal] {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 650ms ease, transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .reveal-ready [data-home-reveal].is-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        .tool-grid .tool-card:nth-child(2),
        .tool-grid .tool-card:nth-child(5),
        .tool-grid .tool-card:nth-child(8) { transition-delay: 70ms; }
        .tool-grid .tool-card:nth-child(3),
        .tool-grid .tool-card:nth-child(6),
        .tool-grid .tool-card:nth-child(9) { transition-delay: 140ms; }

        @keyframes hero-fade-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes home-glow-drift {
          from { transform: translate3d(-2%, 1%, 0) scale(1); }
          to { transform: translate3d(4%, -3%, 0) scale(1.08); }
        }

        @keyframes accent-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }

        @media (max-width: 960px) {
          .home-hero {
            min-height: 640px;
            padding: 56px 32px;
          }

          .home-title {
            font-size: 50px;
          }

          .home-subtitle {
            font-size: 21px;
          }

          .home-section {
            padding: 64px 28px;
          }

          .tool-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .steps {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .feature-band {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .home-hero {
            min-height: 620px;
            padding: 42px 18px;
            background-image:
              linear-gradient(180deg, rgba(7, 17, 31, 0.96) 0%, rgba(7, 17, 31, 0.86) 58%, rgba(7, 17, 31, 0.78) 100%),
              url('/images/hero.png');
            background-position: center top;
          }

          .home-title {
            font-size: 40px;
          }

          .home-subtitle,
          .section-copy {
            font-size: 17px;
          }

          .home-actions,
          .section-actions {
            width: 100%;
          }

          .home-cta,
          .home-secondary-cta,
          .home-link-cta {
            font-size: 17px;
            width: 100%;
          }

          .home-section {
            padding: 52px 18px;
          }

          .section-heading {
            font-size: 32px;
          }

          .tool-grid,
          .steps {
            grid-template-columns: 1fr;
          }

          .tool-card,
          .feature-panel {
            padding: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-page *,
          .home-page *::before,
          .home-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }

          .reveal-ready [data-home-reveal] {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <HomeMotion />

      <section className="home-hero">
        {heroVideo ? <PlacedVideo placement={heroVideo} className="home-hero-video" /> : null}
        <div className="home-hero-content">
          <p className="home-eyebrow">For promoters, venues, and event teams</p>

          <h1 className="home-title">
            {branding.homepageHeadline}
          </h1>

          <p className="home-subtitle">
            LaunchPad gives promoters one place to sell tickets online,
            handle door sales, scan guests, manage comps, sell merchandise,
            track event-day totals, and receive payouts.
          </p>

          <div className="home-actions">
            <Link href="/promoter/apply" className="home-cta">
              Start Selling Tickets
            </Link>

            <Link href="/events" className="home-secondary-cta">
              Browse Events
            </Link>
          </div>

          <p className="home-customer-note">
            Looking for tickets?{" "}
            <Link href="/events">Browse events and buy as a guest.</Link>
          </p>
        </div>
      </section>

      <section className="home-section" data-home-reveal>
        <div className="section-inner">
          {featuredVideo ? <PlacedVideo placement={featuredVideo} className="home-section-video" /> : null}
          <p className="section-kicker">Promoter tools</p>

          <h2 className="section-heading">
            Everything your event needs before doors open.
          </h2>

          <p className="section-copy">
            LaunchPad is built for the operational side of live events:
            selling, scanning, register totals, comps, merchandise, payouts,
            and ticket presentation stay connected.
          </p>

          <div className="tool-grid">
            {promoterTools.map((tool) => (
              <article className="tool-card" key={tool.title} data-home-reveal>
                <div className="tool-icon">{tool.icon}</div>
                <h3>{tool.title}</h3>
                <p>{tool.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section alt" data-home-reveal>
        <div className="section-inner">
          <p className="section-kicker">How it works</p>

          <h2 className="section-heading">
            From application to event night.
          </h2>

          <div className="steps">
            {promoterSteps.map((step, index) => (
              <div className="step" key={step}>
                <span className="step-number">Step {index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section" data-home-reveal>
        <div className="section-inner feature-band">
          <div>
            <p className="section-kicker">Event-day command center</p>

            <h2 className="section-heading">
              Run the whole event from LaunchPad.
            </h2>

            <p className="section-copy">
              LaunchPad is more than a checkout page. Promoters can manage
              ticket sales, door sales, guest scanning, comps, merchandise,
              register totals, and reports from the same platform.
            </p>
          </div>

          <div className="feature-panel">
            <ul>
              <li>Scan tickets and protect against duplicate entry.</li>
              <li>Sell door tickets and keep register totals organized.</li>
              <li>Track comps, merchandise, and event-day reporting.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="home-section alt" data-home-reveal>
        <div className="section-inner feature-band">
          <div>
            <p className="section-kicker">Promoter payouts</p>

            <h2 className="section-heading">
              Your sales. Your payout.
            </h2>

            <p className="section-copy">
              Approved promoters can securely complete payout onboarding
              through Stripe Connect. LaunchPad does not store promoter bank
              account numbers.
            </p>
          </div>

          <div className="feature-panel">
            <ul>
              <li>Stripe handles sensitive payout onboarding.</li>
              <li>Payout setup stays separate from customer checkout.</li>
              <li>Promoters can review payout status from their dashboard.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="home-section" data-home-reveal>
        <div className="section-inner feature-band">
          <div>
            <p className="section-kicker">Ticket Design Studio</p>

            <h2 className="section-heading">
              Make your tickets look like your event.
            </h2>

            <p className="section-copy">
              Promoters can customize ticket design while preserving the QR
              code and ticket validation behavior that powers check-in.
            </p>
          </div>

          <div className="feature-panel">
            <ul>
              <li>Customize colors, layout, flyer treatment, and ticket text.</li>
              <li>Keep QR and ticket-number validation intact.</li>
              <li>Use a ticket style that matches the show experience.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="home-section alt" data-home-reveal>
        <div className="section-inner">
          {promoterVideo ? <PlacedVideo placement={promoterVideo} className="home-section-video" /> : null}
          <p className="section-kicker">Start selling</p>

          <h2 className="section-heading">
            Ready to sell your next event?
          </h2>

          <p className="section-copy">
            Apply for promoter access. After approval, use Promoter Login to
            create events and manage sales.
          </p>

          <div className="section-actions">
            <Link href="/promoter/apply" className="home-cta">
              Become a Promoter
            </Link>

            <Link href="/promoter-login" className="home-link-cta">
              Promoter Login
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section customer-band" data-home-reveal>
        <div className="section-inner">
          <p className="section-kicker">For ticket buyers</p>

          <h2 className="section-heading">
            Just looking for tickets?
          </h2>

          <p className="section-copy">
            Browse upcoming events and buy as a guest. Customer accounts are
            available when you want ticket wallet and order-history access.
          </p>

          <div className="section-actions">
            <Link href="/events" className="home-secondary-cta">
              Browse Events
            </Link>

            <Link href="/login" className="home-link-cta">
              Customer Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
