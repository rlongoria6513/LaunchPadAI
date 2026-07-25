import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#081225",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      

      {/* Hero */}
      <section
        style={{
          
          minHeight: "720px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          textAlign: "left",
          padding: "60px",
          backgroundImage: "url('/images/hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <h1 style={{ fontSize: "64px" }}>Sell Event Tickets with AI</h1>

        <p
          style={{
            fontSize: "24px",
            color: "#9ecbff",
            marginTop: "20px",
          }}
        >
          Concerts • Festivals • Comedy • Sports • Conferences
        </p>

        <Link href="/create-event">
          <button
            style={{
              marginTop: "50px",
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "18px 45px",
              borderRadius: "12px",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            Create My Event
          </button>
        </Link>
      </section>

      {/* Features */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "25px",
          padding: "100px 80px",
        }}
      >
        <div
          style={{
            background: "#101c33",
            padding: "30px",
            borderRadius: "15px",
          }}
        >
          <h2>🎫 Ticket Sales</h2>
          <p>Sell unlimited tickets online.</p>
        </div>

        <div
          style={{
            background: "#101c33",
            padding: "30px",
            borderRadius: "15px",
          }}
        >
          <h2>🤖 AI Promotion</h2>
          <p>Create advertisements instantly.</p>
        </div>

        <div
          style={{
            background: "#101c33",
            padding: "30px",
            borderRadius: "15px",
          }}
        >
          <h2>📱 QR Check-In</h2>
          <p>Scan tickets from any phone.</p>
        </div>
      </section>
    </main>
  );
}