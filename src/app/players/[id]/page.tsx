import { prisma } from "@/lib/prisma";
import Link from "next/link";

type PlayerPageProps = {
  params: {
    id?: string;
    [key: string]: string | string[] | undefined;
  };
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  // DEBUG: what does params actually look like?
  const rawParams = JSON.stringify(params, null, 2);

  const playerId =
    typeof params.id === "string" && params.id.length > 0
      ? params.id
      : undefined;

  // If we don't even have an id, DON'T call Prisma yet.
  if (!playerId) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          background: "#f3f4f6",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            padding: 16,
          }}
        >
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>Player not found</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            No player <code>id</code> was provided in the URL params.
          </p>

          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Debug info (from Next.js route params)
          </h2>
          <pre
            style={{
              fontSize: 12,
              background: "#0f172a",
              color: "#e5e7eb",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
              border: "1px solid #1f2937",
            }}
          >
            {rawParams}
          </pre>

          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 12 }}>
            Make sure the path is{" "}
            <code>/players/&lt;playerId-from-db&gt;</code> and that this file
            lives at <code>src/app/players/[id]/page.tsx</code>.
          </p>

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
              }}
            >
              ← Back to Parent Dashboard
            </Link>
            <Link
              href="/coach"
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
              }}
            >
              🎯 Coach View
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // We *do* have an id now – safe to hit Prisma.
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      parent: true,
      metrics: true,
      metricsHistory: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      bookings: {
        orderBy: { start: "desc" },
        take: 20,
      },
    },
  });

  if (!player) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Player not found in database</h1>
        <p>
          We received id:{" "}
          <code style={{ fontFamily: "monospace" }}>{playerId}</code> but could
          not find a player with that id.
        </p>
        <h2 style={{ marginTop: 12, fontSize: 14 }}>Debug params:</h2>
        <pre
          style={{
            fontSize: 12,
            background: "#0f172a",
            color: "#e5e7eb",
            padding: 12,
            borderRadius: 8,
            overflowX: "auto",
          }}
        >
          {rawParams}
        </pre>
        <p style={{ marginTop: 12 }}>
          <Link href="/dashboard" style={{ textDecoration: "underline" }}>
            ← Back to Parent Dashboard
          </Link>
        </p>
      </main>
    );
  }

  // ------- NORMAL PROFILE VIEW (same as before) -------

  const history = player.metricsHistory;
  const lessons = player.bookings;

  const metricKeys = [
    { key: "teeExitVelo", label: "Tee EV", unit: "mph", higher: true },
    {
      key: "softTossExitVelo",
      label: "Soft Toss EV",
      unit: "mph",
      higher: true,
    },
    { key: "sixtyTime", label: "60 Time", unit: "sec", higher: false },
    { key: "fiveTenFiveTime", label: "5-10-5", unit: "sec", higher: false },
    { key: "homeToFirstTime", label: "Home–1st", unit: "sec", higher: false },
    { key: "homeToSecondTime", label: "Home–2nd", unit: "sec", higher: false },
  ] as const;

  const bestMap: Record<string, number> = {};
  for (const { key, higher } of metricKeys) {
    let best: number | null = null;
    for (const h of history as any[]) {
      const v = h[key] as number | null;
      if (v == null) continue;
      if (best == null) best = v;
      else if (higher ? v > best : v < best) best = v;
    }
    if (best != null) bestMap[key] = best;
  }

  const initial =
    (player.name && player.name.trim().charAt(0).toUpperCase()) || "P";

  const formatMetric = (value?: number | null, unit?: string) => {
    if (value == null) return "-";
    return `${value} ${unit ?? ""}`.trim();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "24px 16px 40px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* TOP BAR */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                overflow: "hidden",
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: "#4b5563",
                flexShrink: 0,
              }}
            >
              {player.photoUrl ? (
                <img
                  src={player.photoUrl}
                  alt={player.name ?? "Player photo"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                initial
              )}
            </div>
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
                {player.name}
              </h1>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0" }}>
                Player Profile · Ethan Riley Training
                {player.parent && (
                  <>
                    {" "}
                    · Parent: {player.parent.name ?? player.parent.email}
                  </>
                )}
              </p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                Player ID:{" "}
                <span style={{ fontFamily: "monospace" }}>
                  {player.id.slice(0, 10)}…
                </span>{" "}
                · Joined{" "}
                {new Date(player.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Parent Dashboard
            </Link>
            <Link
              href="/coach"
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🎯 Coach View
            </Link>
          </div>
        </header>

        {/* MAIN GRID: LEFT = METRICS, RIGHT = LESSONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1.3fr)",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          {/* LEFT: METRICS & SESSIONS */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              padding: 16,
              boxShadow: "0 12px 24px rgba(15, 23, 42, 0.04)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                marginBottom: 8,
                color: "#111827",
              }}
            >
              Current Metrics Snapshot
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 8,
                fontSize: 12,
              }}
            >
              <MetricTile
                label="Tee EV"
                value={formatMetric(
                  player.metrics?.teeExitVelo,
                  "mph"
                )}
              />
              <MetricTile
                label="Soft Toss EV"
                value={formatMetric(
                  player.metrics?.softTossExitVelo,
                  "mph"
                )}
              />
              <MetricTile
                label="60 Time"
                value={formatMetric(
                  player.metrics?.sixtyTime,
                  "sec"
                )}
              />
              <MetricTile
                label="5-10-5"
                value={formatMetric(
                  player.metrics?.fiveTenFiveTime,
                  "sec"
                )}
              />
              <MetricTile
                label="Home–1st"
                value={formatMetric(
                  player.metrics?.homeToFirstTime,
                  "sec"
                )}
              />
              <MetricTile
                label="Home–2nd"
                value={formatMetric(
                  player.metrics?.homeToSecondTime,
                  "sec"
                )}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                borderTop: "1px solid #e5e7eb",
                paddingTop: 10,
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 4,
                  color: "#111827",
                }}
              >
                Recent Metric Sessions
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginTop: 0,
                  marginBottom: 8,
                }}
              >
                Newest at the top ·{" "}
                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                  PR
                </span>{" "}
                = personal record · green = better, red = needs work.
              </p>

              {history.length === 0 ? (
                <p style={{ fontSize: 12, color: "#6b7280" }}>
                  No metric sessions logged yet.
                </p>
              ) : (
                <div
                  style={{
                    maxHeight: 320,
                    overflowY: "auto",
                    fontSize: 12,
                  }}
                >
                  {history.map((entry, index) => {
                    const date = new Date(
                      entry.createdAt
                    ).toLocaleDateString();

                    const prev =
                      index + 1 < history.length
                        ? (history[index + 1] as any)
                        : null;

                    return (
                      <div
                        key={entry.id}
                        style={{
                          paddingBottom: 8,
                          marginBottom: 8,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: 2,
                            color: "#111827",
                          }}
                        >
                          {date}
                        </div>
                        <ul
                          style={{
                            listStyle: "none",
                            paddingLeft: 0,
                            margin: 0,
                          }}
                        >
                          {metricKeys.map(
                            ({ key, label, unit, higher }) => {
                              const val = (entry as any)[
                                key
                              ] as number | null;
                              if (val == null) return null;

                              const best = bestMap[key];
                              const isPR =
                                best != null && val === best;

                              let diffText = "";
                              let diffColor: string | undefined;

                              if (prev && (prev as any)[key] != null) {
                                const prevVal = (prev as any)[
                                  key
                                ] as number;
                                const diff = val - prevVal;
                                if (Math.abs(diff) > 0.01) {
                                  const rounded =
                                    Math.round(diff * 10) / 10;
                                  const formatted =
                                    (diff > 0 ? "+" : "") +
                                    rounded.toString() +
                                    " " +
                                    unit;
                                  const improved = higher
                                    ? diff > 0
                                    : diff < 0;
                                  diffText = `(${formatted} vs last)`;
                                  diffColor = improved
                                    ? "#16a34a"
                                    : "#dc2626";
                                }
                              }

                              return (
                                <li
                                  key={key}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginBottom: 2,
                                  }}
                                >
                                  <span>
                                    <strong>{label}:</strong> {val}{" "}
                                    {unit}
                                  </span>
                                  {isPR && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: "#16a34a",
                                        fontWeight: 700,
                                      }}
                                    >
                                      PR
                                    </span>
                                  )}
                                  {diffText && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: diffColor,
                                      }}
                                    >
                                      {diffText}
                                    </span>
                                  )}
                                </li>
                              );
                            }
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: LESSON HISTORY */}
          <section
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              padding: 16,
              boxShadow: "0 12px 24px rgba(15, 23, 42, 0.04)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                marginBottom: 8,
                color: "#111827",
              }}
            >
              Lesson History & Notes
            </h2>
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              Most recent lessons at the top.
            </p>

            {lessons.length === 0 ? (
              <p style={{ fontSize: 12, color: "#6b7280" }}>
                No lessons recorded yet for this player.
              </p>
            ) : (
              <div
                style={{
                  maxHeight: 360,
                  overflowY: "auto",
                  fontSize: 12,
                }}
              >
                {lessons.map((b, idx) => (
                  <div
                    key={b.id}
                    style={{
                      paddingBottom: 8,
                      marginBottom: 8,
                      borderBottom:
                        idx === lessons.length - 1
                          ? "none"
                          : "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#111827",
                        marginBottom: 2,
                      }}
                    >
                      {new Date(b.start).toLocaleString()}
                    </div>
                    <div style={{ marginBottom: 2 }}>
                      Lesson:{" "}
                      <strong>{b.lessonType}</strong> ·{" "}
                      {b.durationMinutes} min
                    </div>
                    {b.notes && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4b5563",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <strong>Notes:</strong> {b.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

type MetricTileProps = {
  label: string;
  value: string;
};

function MetricTile({ label, value }: MetricTileProps) {
  const isDash = value === "-";
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: isDash ? "#f9fafb" : "#eff6ff",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: isDash ? "#9ca3af" : "#1d4ed8",
        }}
      >
        {value}
      </span>
    </div>
  );
}
