"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";


type PlayerCard = {
  id: string;
  name: string;
  school?: string | null;
  classYear?: string | null;
  gradYear?: number | null;
  position?: string | null;
  bats?: string | null;
  throws?: string | null;
  travelOrg?: string | null;
  age?: number | null;
  photoUrl?: string | null;
  metrics?: {
    teeExitVelo?: number | null;
    softTossExitVelo?: number | null;
    sixtyTime?: number | null;
    fiveTenFiveTime?: number | null;
    homeToFirstTime?: number | null;
    homeToSecondTime?: number | null;
  } | null;
};

type BookingRow = {
  id: string;
  startISO: string;
  lessonType: string | null;
  durationMinutes: number | null;
  notes: string | null;
  player: { id: string; name: string };
};

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 999,
    border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
    background: active ? "linear-gradient(135deg,#2563eb,#0ea5e9)" : "#fff",
    color: active ? "#fff" : "#111827",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: active ? "0 12px 24px rgba(37,99,235,0.18)" : "none",
  };
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  };
}

function fmtDT(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 9999,
        padding: "6px 10px",
        fontSize: 12,
        background: "#f9fafb",
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span style={{ color: "#6b7280", fontWeight: 800 }}>{label}</span>
      <span style={{ fontWeight: 900 }}>{value}</span>
    </div>
  );
}

export default function DashboardTabsClient(props: {
  parentName: string;
  players: PlayerCard[];
  upcomingBookings: BookingRow[];
}) {
  const [tab, setTab] = useState<"players" | "book" | "upcoming" | "account">(
    "players"
  );
  const searchParams = useSearchParams();
const booked = searchParams.get("booked") === "1";
const tabFromUrl = searchParams.get("tab");

useEffect(() => {
  if (tabFromUrl === "upcoming") setTab("upcoming");
}, [tabFromUrl]);

  const upcoming = useMemo(() => {
    return [...props.upcomingBookings].sort(
      (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
    );
  
  }, [props.upcomingBookings]);
    const nextLesson = upcoming.find((b) => new Date(b.startISO).getTime() >= Date.now()) ?? null;

  const nextLessonLabel = nextLesson
    ? `${fmtDT(nextLesson.startISO)} · ${nextLesson.player?.name ?? "Player"}`
    : "No upcoming lessons";

  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
                {/* ✅ Summary + Quick Actions */}
        <section
          className="dashSummary"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>
              Next Lesson
            </div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 900, color: "#111827" }}>
              {nextLessonLabel}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setTab("upcoming")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                View Upcoming
              </button>

              <Link
                href="/book"
                style={{
                  textDecoration: "none",
                  background: "linear-gradient(135deg,#2563eb,#0ea5e9)",
                  color: "#fff",
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 12,
                  boxShadow: "0 14px 26px rgba(37,99,235,0.18)",
                  display: "inline-block",
                }}
              >
                Book a Lesson
              </Link>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>Players</div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#111827" }}>
              {props.players.length}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
              Tap Players to view
            </div>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 18,
              padding: 14,
              boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>Upcoming</div>
            <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#111827" }}>
              {upcoming.length}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
              Scheduled lessons
            </div>
          </div>
        </section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
  <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
    Parent Dashboard
  </h1>
  <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>
    Signed in as <b>{props.parentName}</b>
  </div>

  {booked && (
    <div
      style={{
        marginTop: 10,
        border: "1px solid #bbf7d0",
        background: "#ecfdf5",
        color: "#065f46",
        borderRadius: 12,
        padding: "10px 12px",
        fontWeight: 800,
        fontSize: 13,
      }}
    >
      ✅ Lesson booked successfully. Check your Upcoming tab for details.
    </div>
  )}
</div>


          {/* Always-visible actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href="/onboarding"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "#2563eb",
                color: "#fff",
                fontWeight: 900,
                textDecoration: "none",
                boxShadow: "0 14px 26px rgba(37,99,235,0.18)",
                whiteSpace: "nowrap",
              }}
            >
              + Add Player
            </Link>

            <Link
              href="/book"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#111827",
                fontWeight: 800,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Book a Lesson
            </Link>

            <SignOutButton />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button style={pillStyle(tab === "players")} onClick={() => setTab("players")}>
            Players ({props.players.length})
          </button>
          <button style={pillStyle(tab === "book")} onClick={() => setTab("book")}>
            Booking
          </button>
          <button style={pillStyle(tab === "upcoming")} onClick={() => setTab("upcoming")}>
            Upcoming
          </button>
          <button style={pillStyle(tab === "account")} onClick={() => setTab("account")}>
            Account
          </button>
        </div>

        {/* PLAYERS */}
        {tab === "players" && (
  <section style={cardStyle()}>
    <div>
      <div style={{ fontSize: 18, fontWeight: 900 }}>Your Players</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
        Click a player to view their full profile and metrics.
      </div>
    </div>

    <div
      className="playersGrid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))", // ✅ KEEP DESKTOP INLINE
        gap: 12,
        marginTop: 14,
      }}
    >
      {props.players.map((p) => (
        <Link
          key={p.id}
          href={`/player?id=${p.id}`}
          className="playerCard"
          style={{
            textDecoration: "none",
            color: "inherit",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 14,
            background: "#fff",
            boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
            display: "block",
          }}
        >
          <div className="playerTopRow" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {p.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                p.name?.slice(0, 1).toUpperCase()
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="playerName" style={{ fontWeight: 900, fontSize: 16 }}>
                {p.name}
              </div>
              <div className="playerMeta" style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {(p.school ?? "—") +
                  " · " +
                  (p.classYear ?? "—") +
                  (p.gradYear ? ` · Class of ${p.gradYear}` : "")}
              </div>
            </div>
          </div>

          <div className="playerMetricRow" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            <MetricMini
              label="Tee"
              value={p.metrics?.teeExitVelo != null ? `${p.metrics.teeExitVelo} mph` : "-"}
            />
            <MetricMini
              label="60"
              value={p.metrics?.sixtyTime != null ? `${p.metrics.sixtyTime}s` : "-"}
            />
            <MetricMini
              label="5-10-5"
              value={p.metrics?.fiveTenFiveTime != null ? `${p.metrics.fiveTenFiveTime}s` : "-"}
            />
          </div>
        </Link>
      ))}
    </div>

    {props.players.length === 0 && (
      <div style={{ marginTop: 14, color: "#6b7280", fontSize: 14 }}>
        No players yet. Click <b>+ Add Player</b> at the top to create your first profile.
      </div>
    )}

    {/* ✅ Mobile-only CSS (does NOT change desktop) */}
    <style jsx>{`
      @media (max-width: 820px) {
        .playersGrid {
          grid-template-columns: 1fr !important;
        }

        .playerCard {
          padding: 12px !important;
        }

        .playerName {
          font-size: 16px !important;
          line-height: 1.15 !important;
          word-break: break-word;
        }

        .playerMeta {
          font-size: 12px !important;
          line-height: 1.25 !important;
          word-break: break-word;
        }

        /* Make the 3 minis readable on mobile */
        .playerMetricRow {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px !important;
        }
      }

      @media (max-width: 380px) {
        /* Extra-small phones: 2 columns so text doesn’t crush */
        .playerMetricRow {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
    `}</style>
  </section>
)}


        {/* BOOK */}
        {tab === "book" && (
          <section style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Booking</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Use the booking page to select a player and choose an available slot.
            </div>

            <div style={{ marginTop: 14 }}>
              <Link
                href="/book"
                style={{
                  textDecoration: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 900,
                  padding: "12px 14px",
                  borderRadius: 12,
                  boxShadow: "0 14px 26px rgba(37,99,235,0.18)",
                  display: "inline-block",
                }}
              >
                Go to Booking
              </Link>
            </div>
          </section>
        )}

        {/* UPCOMING */}
        {tab === "upcoming" && (
          <section style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Upcoming Lessons</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Your next scheduled sessions.
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {upcoming.slice(0, 12).map((b) => (
                <div
                  key={b.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {b.player.name} · {fmtDT(b.startISO)}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    {b.lessonType ?? "Lesson"} · {b.durationMinutes ?? "-"} min
                  </div>
                  {b.notes ? (
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      <b>Notes:</b> {b.notes}
                    </div>
                  ) : null}
                </div>
              ))}

              {upcoming.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  No lessons scheduled yet.
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* ACCOUNT */}
        {tab === "account" && (
          <section style={cardStyle()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Account</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                  Manage your account and quick actions.
                </div>
              </div>

              <SignOutButton />
            </div>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Signed in</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Name</div>
                <div style={{ fontWeight: 900 }}>{props.parentName}</div>

                <div style={{ height: 10 }} />

                <div style={{ color: "#6b7280", fontSize: 13 }}>Role</div>
                <div style={{ fontWeight: 900 }}>Parent</div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 10 }}>Quick actions</div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <Link
                    href="/onboarding"
                    style={{
                      textDecoration: "none",
                      background: "#2563eb",
                      color: "#fff",
                      fontWeight: 900,
                      padding: "10px 12px",
                      borderRadius: 12,
                      boxShadow: "0 14px 26px rgba(37,99,235,0.18)",
                      display: "inline-block",
                    }}
                  >
                    + Add Player
                  </Link>

                  <Link
                    href="/book"
                    style={{
                      textDecoration: "none",
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#111827",
                      fontWeight: 900,
                      padding: "10px 12px",
                      borderRadius: 12,
                      display: "inline-block",
                    }}
                  >
                    Book a Lesson
                  </Link>
                </div>

                <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                  More settings (password reset, notifications, etc.) can go here later.
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      <style>{`
  /* ✅ Mobile-only fixes: desktop unchanged */
  @media (max-width: 820px) {
    .playersGrid {
      grid-template-columns: 1fr !important;  /* stack cards */
    }

    .playerCard {
      padding: 14px !important;
    }

    /* If your player card has a horizontal row with avatar + name + metrics,
       these help prevent the scrunched look */
    .playerCard * {
      max-width: 100%;
    }

    /* If you have a metrics "pill row" container, make it wrap */
    .metricsRow {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }

    /* Their metric pills/cards */
    .metricPill {
      flex: 1 1 calc(50% - 8px) !important;
      min-width: 140px !important;
    }
  }
`}</style>
      {/* Mobile Bottom Nav (only shows on small screens) */}
      <div className="mobileNav">
        <button
          type="button"
          className={`navBtn ${tab === "players" ? "active" : ""}`}
          onClick={() => setTab("players")}
        >
          <div className="navIcon">👤</div>
          <div className="navLabel">Players</div>
        </button>

        <button
          type="button"
          className={`navBtn ${tab === "book" ? "active" : ""}`}
          onClick={() => setTab("book")}
        >
          <div className="navIcon">📅</div>
          <div className="navLabel">Book</div>
        </button>

        <button
          type="button"
          className={`navBtn ${tab === "upcoming" ? "active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          <div className="navIcon">⏳</div>
          <div className="navLabel">Upcoming</div>
        </button>

        <button
          type="button"
          className={`navBtn ${tab === "account" ? "active" : ""}`}
          onClick={() => setTab("account")}
        >
          <div className="navIcon">⚙️</div>
          <div className="navLabel">Account</div>
        </button>
      </div>

      {/* ✅ One CSS block only (prevents nested styled-jsx errors) */}
      <style>{`
        /* ✅ Mobile-only fixes: desktop unchanged */
        @media (max-width: 820px) {
          .playersGrid {
            grid-template-columns: 1fr !important;
          }

          .playerCard {
            padding: 14px !important;
          }

          .playerCard * {
            max-width: 100%;
          }

          .metricsRow {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          .metricPill {
            flex: 1 1 calc(50% - 8px) !important;
            min-width: 140px !important;
          }

          /* bottom nav spacing so content isn't hidden */
          .dashBody {
            padding-bottom: 92px !important;
          }
        }

        .mobileNav {
          display: none;
        }

        @media (max-width: 820px) {
          .mobileNav {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            height: 66px;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(10px);
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            padding: 8px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
            z-index: 9999;
          }

          .navBtn {
            border: none;
            background: transparent;
            border-radius: 14px;
            display: grid;
            place-items: center;
            gap: 2px;
            padding: 6px 4px;
            cursor: pointer;
            color: #111827;
            font-weight: 900;
          }

          .navBtn.active {
            background: #111827;
            color: #fff;
          }

          .navIcon {
            font-size: 18px;
            line-height: 1;
          }

          .navLabel {
            font-size: 11px;
            line-height: 1;
            opacity: 0.9;
          }
        }
      `}</style>
            <style>{`
        @media (max-width: 820px) {
          .dashSummary {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
