import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="home-main"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 12px", // a bit tighter so it feels even
        background:
          "radial-gradient(circle at top, #e0f2fe 0, #f9fafb 45%, #f3f4f6 100%)",
        overflowX: "hidden", // ✅ prevents any horizontal overflow on mobile
      }}
    >
      <div
        className="home-card"
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 24,
          padding: 20,
          boxShadow:
            "0 18px 45px rgba(15, 23, 42, 0.20), 0 0 0 1px rgba(148, 163, 184, 0.18)",
          boxSizing: "border-box",
        }}
      >
        {/* App title */}
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 9999,
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "9999px",
                background: "#22c55e",
              }}
            />
            Ethan Riley Training
          </div>

          <h1
            style={{
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 6,
            }}
          >
            GameReady Performance
          </h1>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "#4b5563",
              margin: 0,
            }}
          >
            Book lessons, track your player&apos;s metrics, and follow their
            progress in one place.
          </p>
        </header>

        {/* Primary actions */}
        <section
          className="home-cta-section"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <Link
            href="/login"
            className="home-btn primary-btn"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "10px 14px",
              borderRadius: 9999,
              background:
                "linear-gradient(135deg, #2563eb 0%, #1d4ed8 40%, #0f766e 100%)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
              boxSizing: "border-box",
            }}
          >
            Parent / Player Login
          </Link>

          <Link
            href="/register"
            className="home-btn secondary-btn"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "10px 14px",
              borderRadius: 9999,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              color: "#111827",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Create Parent Account
          </Link>

          <Link
            href="/login?coach=1"
            className="home-btn ghost-btn"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "9px 14px",
              borderRadius: 9999,
              border: "1px dashed #cbd5f5",
              background: "rgba(239, 246, 255, 0.7)",
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Coach Login
          </Link>
        </section>

        {/* Tiny footer / hint */}
        <footer
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Tip: Add this page to your Home Screen for an app-like experience.
        </footer>
      </div>
    </main>
  );
}
     