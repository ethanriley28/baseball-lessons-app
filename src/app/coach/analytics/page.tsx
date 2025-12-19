import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export default async function CoachAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/coach/analytics");
  }

  const role = (session.user as any).role as string | undefined;

  if (role !== "COACH") {
    redirect("/dashboard");
  }

  const now = new Date();
  const last30 = daysAgo(30);

  const [players, recentBookings, allMetrics] = await Promise.all([
    prisma.player.findMany({
      include: {
        metrics: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        start: {
          gte: last30,
        },
      },
      include: {
        player: true,
      },
      orderBy: {
        start: "desc",
      },
      take: 40,
    }),
    prisma.metricsEntry.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPlayers = players.length;

  const activePlayerIds = new Set(
    recentBookings.map((b) => b.playerId).filter(Boolean)
  );
  const activePlayersLast30 = activePlayerIds.size;

  const lessonsLast30 = recentBookings.length;

  const metricsByPlayer = new Map<
    string,
    {
      bestTee?: number;
      bestSoft?: number;
      lastSessionDate?: Date;
      totalSessions: number;
    }
  >();

  for (const entry of allMetrics) {
    const pId = entry.playerId;
    if (!pId) continue;
    const current = metricsByPlayer.get(pId) ?? {
      bestTee: undefined,
      bestSoft: undefined,
      lastSessionDate: undefined,
      totalSessions: 0,
    };

    if (entry.teeExitVelo != null) {
      if (current.bestTee == null || entry.teeExitVelo > current.bestTee) {
        current.bestTee = entry.teeExitVelo;
      }
    }
    if (entry.softTossExitVelo != null) {
      if (current.bestSoft == null || entry.softTossExitVelo > current.bestSoft) {
        current.bestSoft = entry.softTossExitVelo;
      }
    }
    if (
      current.lastSessionDate == null ||
      entry.createdAt > current.lastSessionDate
    ) {
      current.lastSessionDate = entry.createdAt;
    }
    current.totalSessions += 1;
    metricsByPlayer.set(pId, current);
  }

  const teeLeaderboard = players
    .map((p) => {
      const info = metricsByPlayer.get(p.id);
      return {
        id: p.id,
        name: p.name ?? "Unnamed Player",
        school: p.school ?? "",
        bestTee: info?.bestTee ?? null,
      };
    })
    .filter((x) => x.bestTee != null)
    .sort((a, b) => b.bestTee! - a.bestTee!)
    .slice(0, 5);

  const mostActiveByLessons = Array.from(
    recentBookings.reduce<Map<string, { count: number; playerName: string }>>(
      (map, b) => {
        if (!b.playerId) return map;
        const prev = map.get(b.playerId) ?? {
          count: 0,
          playerName: b.player?.name ?? "Unnamed Player",
        };
        prev.count += 1;
        map.set(b.playerId, prev);
        return map;
      },
      new Map()
    )
  )
    .map(([playerId, info]) => ({
      playerId,
      name: info.playerName,
      count: info.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <main
      style={{
        padding: 24,
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.02em",
                color: "#111827",
              }}
            >
              Coach Analytics
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              High-level view of your training business: players, workload, and
              performance trends.
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 2,
              }}
            >
              Last 30 days window for activity-based stats.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/coach"
              style={{
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
              }}
            >
              ← Back to Coach View
            </Link>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <SummaryCard
            label="Total Players"
            value={totalPlayers.toString()}
            helper="Players with profiles in the system."
          />
          <SummaryCard
            label="Active Players (30d)"
            value={activePlayersLast30.toString()}
            helper="Players with at least one lesson in the last 30 days."
          />
          <SummaryCard
            label="Lessons (30d)"
            value={lessonsLast30.toString()}
            helper="Total scheduled lessons in the last 30 days."
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 8px",
                  color: "#111827",
                }}
              >
                Top Tee Exit Velocity
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 10,
                }}
              >
                Best recorded tee exit velo for each player. Great snapshot for
                who&apos;s driving the ball right now.
              </p>

              {teeLeaderboard.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  No metric history yet.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {teeLeaderboard.map((p, idx) => (
                    <li
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: idx === 0 ? "#eff6ff" : "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "9999px",
                            background:
                              idx === 0
                                ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                                : "#e5e7eb",
                            color: idx === 0 ? "#ffffff" : "#374151",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {p.name}
                          </div>
                          {p.school && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#6b7280",
                              }}
                            >
                              {p.school}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {p.bestTee?.toFixed(1)}{" "}
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "#6b7280",
                          }}
                        >
                          mph
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 8px",
                  color: "#111827",
                }}
              >
                Most Active Players (30d)
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 10,
                }}
              >
                Players with the most scheduled lessons in the last month.
                Useful for seeing who&apos;s getting the most reps.
              </p>

              {mostActiveByLessons.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  No lessons recorded in the last 30 days.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {mostActiveByLessons.map((row) => (
                    <li
                      key={row.playerId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {row.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#4b5563",
                        }}
                      >
                        {row.count}{" "}
                        <span
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                          }}
                        >
                          lessons
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: "0 0 8px",
                  color: "#111827",
                }}
              >
                Recent Lessons (30d)
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 10,
                }}
              >
                Quick log of your latest lessons. Good way to review how busy
                your schedule has been.
              </p>

              {recentBookings.length === 0 ? (
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    margin: 0,
                  }}
                >
                  No lessons scheduled in the last 30 days.
                </p>
              ) : (
                <div
                  style={{
                    maxHeight: 360,
                    overflowY: "auto",
                    paddingRight: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {recentBookings.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "#f9fafb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {b.player?.name ?? "Player"}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4b5563",
                        }}
                      >
                        {new Date(b.start).toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#374151",
                          marginTop: 2,
                        }}
                      >
                        Lesson: <strong>{b.lessonType}</strong> ·{" "}
                        {b.durationMinutes} min
                      </div>
                      {b.notes && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          Notes: {b.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard(props: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {props.label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        {props.value}
      </div>
      {props.helper && (
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          {props.helper}
        </div>
      )}
    </div>
  );
}
