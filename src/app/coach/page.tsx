import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CoachPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/coach");

  const role = (session.user as any).role as string | undefined;
  if (role !== "COACH") redirect("/dashboard");

  const tileStyle: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    textDecoration: "none",
    color: "#111827",
    display: "block",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 6,
  };

  const descStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.35,
  };

  return (
    <main
      id="coach-page"
      style={{ padding: 24, background: "#f3f4f6", minHeight: "100vh" }}
    >
      <div className="wrap" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header className="header" style={{ marginBottom: 16 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              margin: 0,
              color: "#111827",
            }}
          >
            Coach View
          </h1>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
            Manage lessons, availability, payments, and player metrics.
          </div>
        </header>

        <section
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <Link href="/coach/calendar" style={tileStyle} className="tile">
            <div style={titleStyle}>Calendar</div>
            <div style={descStyle}>
              Add availability, move lessons, mark complete/paid.
            </div>
          </Link>

          <Link href="/coach/players" style={tileStyle} className="tile">
            <div style={titleStyle}>Player Metrics</div>
            <div style={descStyle}>
              Update exit velo, sprint times, and notes fast.
            </div>
          </Link>

          <Link href="/coach/money" style={tileStyle} className="tile">
            <div style={titleStyle}>Money Dashboard</div>
            <div style={descStyle}>
              Track paid/unpaid, methods, trends, and leaderboard.
            </div>
          </Link>
        </section>
      </div>

      {/* MOBILE ONLY OVERRIDES — desktop unchanged */}
      <style>{`
        @media (max-width: 820px) {
          #coach-page {
            padding: 14px !important;
          }

          #coach-page .wrap {
            padding: 0 6px;
          }

          #coach-page .header {
            margin-bottom: 12px;
          }

          #coach-page .grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          #coach-page .tile {
            padding: 14px !important;
          }
        }
      `}</style>
    </main>
  );
}
