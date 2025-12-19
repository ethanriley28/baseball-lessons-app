import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoachPlayerMetricsCard from "@/components/CoachPlayerMetricsCard";

export default async function CoachPlayersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/coach/players");
  const role = (session.user as any).role as string | undefined;
  if (role !== "COACH") redirect("/dashboard");

  const players = await prisma.player.findMany({
    include: {
      parent: true,
      metrics: true,
      metricsHistory: {
        orderBy: { createdAt: "desc" },
        take: 25, // enough to detect PRs & trends
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ padding: 24, background: "#f3f4f6", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "#111827" }}>
              Players + Metrics
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Update player metrics quickly (saves snapshot + history).
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/coach"
              style={{
                fontSize: 12,
                padding: "8px 12px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
                fontWeight: 800,
              }}
            >
              ← Back to Coach View
            </Link>

            <Link
              href="/coach/calendar"
              style={{
                fontSize: 12,
                padding: "8px 12px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
                fontWeight: 800,
              }}
            >
              Calendar
            </Link>
          </div>
        </header>

        <div style={{ display: "grid", gap: 12 }}>
          {players.map((p) => (
            <CoachPlayerMetricsCard
              key={p.id}
              playerId={p.id}
              playerName={p.name}
              parentName={p.parent?.name ?? null}
              metrics={
                p.metrics
                  ? {
                      teeExitVelo: p.metrics.teeExitVelo ?? null,
                      softTossExitVelo: p.metrics.softTossExitVelo ?? null,
                      sixtyTime: p.metrics.sixtyTime ?? null,
                      fiveTenFiveTime: p.metrics.fiveTenFiveTime ?? null,
                      homeToFirstTime: p.metrics.homeToFirstTime ?? null,
                      homeToSecondTime: p.metrics.homeToSecondTime ?? null,
                      updatedAtISO: p.metrics.updatedAt ? p.metrics.updatedAt.toISOString() : null,
                    }
                  : null
              }
              metricsHistory={p.metricsHistory.map((h) => ({
                createdAt: h.createdAt,
                teeExitVelo: h.teeExitVelo ?? null,
                softTossExitVelo: h.softTossExitVelo ?? null,
                sixtyTime: h.sixtyTime ?? null,
                fiveTenFiveTime: h.fiveTenFiveTime ?? null,
                homeToFirstTime: h.homeToFirstTime ?? null,
                homeToSecondTime: h.homeToSecondTime ?? null,
              }))}
            />
          ))}

          {players.length === 0 ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                background: "#fff",
                borderRadius: 16,
                padding: 14,
                color: "#6b7280",
                fontWeight: 700,
              }}
            >
              No players found yet.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
