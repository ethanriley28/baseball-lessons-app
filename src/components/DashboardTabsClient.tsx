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

type BookingRowInput = {
  id: string;
  startISO: string;
  // these may or may not exist depending on what your server sends
  endISO?: string;
  lessonType: string | null;
  durationMinutes: number | null;
  notes: string | null;
  player: { id: string; name: string };

  completedAtISO?: string | null;
  paidAtISO?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
};

type BookingUI = {
  id: string;
  startISO: string;
  endISO: string;
  lessonType: string | null;
  durationMinutes: number | null;
  notes: string | null;
  player: { id: string; name: string };

  completedAtISO: string | null;
  paidAtISO: string | null;
  paymentMethod: string | null;
  status: string | null;
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

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "red" | "blue" | "gray";
}) {
  const styles: Record<string, React.CSSProperties> = {
    green: { background: "#dcfce7", border: "1px solid #86efac", color: "#14532d" },
    red: { background: "#fee2e2", border: "1px solid #fca5a5", color: "#7f1d1d" },
    blue: { background: "#dbeafe", border: "1px solid #93c5fd", color: "#1e3a8a" },
    gray: { background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#111827" },
  };

  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 1,
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
}

function computeEndISO(startISO: string, durationMinutes: number | null): string {
  const start = new Date(startISO);
  const mins = durationMinutes ?? 60;
  const end = new Date(start.getTime() + mins * 60 * 1000);
  return end.toISOString();
}

export default function DashboardTabsClient(props: {
  parentName: string;
  players: PlayerCard[];
  upcomingBookings: BookingRowInput[];
}) {
  const [tab, setTab] = useState<"players" | "book" | "upcoming" | "account">("players");
  const [bookingView, setBookingView] = useState<"UPCOMING" | "COMPLETED" | "ALL">("UPCOMING");

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  useEffect(() => {
    if (tabFromUrl === "upcoming") setTab("upcoming");
    if (tabFromUrl === "players") setTab("players");
    if (tabFromUrl === "book") setTab("book");
    if (tabFromUrl === "account") setTab("account");
  }, [tabFromUrl]);

  // ✅ Keep bookings in state so we can remove a cancelled booking instantly
  const [bookings, setBookings] = useState<BookingUI[]>(() => {
    return (props.upcomingBookings ?? []).map((b) => {
      const endISO = b.endISO ?? computeEndISO(b.startISO, b.durationMinutes);
      return {
        id: b.id,
        startISO: b.startISO,
        endISO,
        lessonType: b.lessonType ?? null,
        durationMinutes: b.durationMinutes ?? null,
        notes: b.notes ?? null,
        player: { id: b.player.id, name: b.player.name },
        completedAtISO: (b as any).completedAtISO ?? null,
        paidAtISO: (b as any).paidAtISO ?? null,
        paymentMethod: (b as any).paymentMethod ?? null,
        status: (b as any).status ?? null,
      };
    });
  });

  // If server sends new props (after navigation), update local state
  useEffect(() => {
    setBookings(
      (props.upcomingBookings ?? []).map((b) => {
        const endISO = b.endISO ?? computeEndISO(b.startISO, b.durationMinutes);
        return {
          id: b.id,
          startISO: b.startISO,
          endISO,
          lessonType: b.lessonType ?? null,
          durationMinutes: b.durationMinutes ?? null,
          notes: b.notes ?? null,
          player: { id: b.player.id, name: b.player.name },
          completedAtISO: (b as any).completedAtISO ?? null,
          paidAtISO: (b as any).paidAtISO ?? null,
          paymentMethod: (b as any).paymentMethod ?? null,
          status: (b as any).status ?? null,
        };
      })
    );
  }, [props.upcomingBookings]);

  const upcomingSorted = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
    );
  }, [bookings]);

  const bookingsFiltered = useMemo(() => {
    const now = Date.now();

    return upcomingSorted.filter((b) => {
      // If you store "completedAtISO", use it; otherwise infer from end time
      const isCompleted = Boolean(b.completedAtISO) || new Date(b.endISO).getTime() < now;

      // If you store cancelled in status, hide from UPCOMING/COMPLETED by default
      const isCancelled = (b.status ?? "").toUpperCase() === "CANCELLED";
      if (bookingView !== "ALL" && isCancelled) return false;

      if (bookingView === "ALL") return true;
      if (bookingView === "UPCOMING") return !isCompleted && !isCancelled;
      if (bookingView === "COMPLETED") return isCompleted && !isCancelled;
      return true;
    });
  }, [upcomingSorted, bookingView]);

  async function cancelLesson(bookingId: string) {
    const ok = window.confirm("Cancel this lesson?");
    if (!ok) return;

    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        alert(`Failed to cancel lesson.${msg ? `\n\n${msg}` : ""}`);
        return;
      }

      // ✅ remove it from the UI immediately
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (e) {
      console.error(e);
      alert("Network error cancelling lesson.");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: 24 }} id="parent-dashboard">
      <div className="wrap" style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          className="header"
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
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Parent Dashboard</h1>
            <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>
              Signed in as <b>{props.parentName}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/book"
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
              + Book a Lesson
            </Link>
            <SignOutButton />
          </div>
        </div>

        {/* Tabs */}
        <div className="tabsRow" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
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
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
                        flex: "0 0 auto",
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
                      <div style={{ fontWeight: 900, fontSize: 16, wordBreak: "break-word" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, wordBreak: "break-word" }}>
                        {(p.school ?? "—") +
                          " · " +
                          (p.classYear ?? "—") +
                          (p.gradYear ? ` · Class of ${p.gradYear}` : "")}
                      </div>
                    </div>
                  </div>

                  <div className="metricsRow" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    <MetricMini
                      label="Tee"
                      value={p.metrics?.teeExitVelo != null ? `${p.metrics.teeExitVelo} mph` : "-"}
                    />
                    <MetricMini label="60" value={p.metrics?.sixtyTime != null ? `${p.metrics.sixtyTime}s` : "-"} />
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
                No players yet. Use <b>Booking</b> or onboarding to add a player.
              </div>
            )}
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

        {/* UPCOMING / HISTORY */}
        {tab === "upcoming" && (
          <section style={cardStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Lessons</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                  View upcoming lessons, completed lessons, and payment status.
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={pillStyle(bookingView === "UPCOMING")} onClick={() => setBookingView("UPCOMING")}>
                  Upcoming
                </button>
                <button style={pillStyle(bookingView === "COMPLETED")} onClick={() => setBookingView("COMPLETED")}>
                  Completed
                </button>
                <button style={pillStyle(bookingView === "ALL")} onClick={() => setBookingView("ALL")}>
                  All
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {bookingsFiltered.map((b) => {
                const isCompleted = Boolean(b.completedAtISO) || new Date(b.endISO).getTime() < Date.now();
                const isPaid = Boolean(b.paidAtISO);
                const isCancelled = (b.status ?? "").toUpperCase() === "CANCELLED";

                return (
                  <div
                    key={b.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 14,
                      background: "#fff",
                      boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 900, color: "#111827" }}>
                        {b.player.name} · {b.lessonType ?? "Lesson"}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {isCancelled ? (
                          <Badge tone="red">Cancelled</Badge>
                        ) : (
                          <Badge tone={isCompleted ? "green" : "blue"}>{isCompleted ? "Completed" : "Scheduled"}</Badge>
                        )}
                        <Badge tone={isPaid ? "green" : "red"}>{isPaid ? "Paid" : "Unpaid"}</Badge>
                        {b.paymentMethod ? <Badge tone="gray">{b.paymentMethod}</Badge> : null}
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: "#374151" }}>
                      <b>{fmtDT(b.startISO)}</b> → {fmtDT(b.endISO)}
                      {b.durationMinutes ? ` · ${b.durationMinutes} min` : null}
                    </div>

                    {b.notes ? (
                      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.35 }}>
                        <b>Notes:</b> {b.notes}
                      </div>
                    ) : null}

                    {!isCancelled ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => cancelLesson(b.id)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 12,
                            border: "1px solid #ef4444",
                            background: "#fff",
                            color: "#ef4444",
                            fontWeight: 900,
                            cursor: "pointer",
                            width: "fit-content",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {bookingsFiltered.length === 0 ? (
                <div style={{ fontSize: 14, color: "#6b7280" }}>No lessons found for this view.</div>
              ) : null}
            </div>
          </section>
        )}

        {/* ACCOUNT */}
        {tab === "account" && (
          <section style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Account</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Account settings can go here.
            </div>

            <div style={{ marginTop: 14 }}>
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
          </section>
        )}
      </div>

      {/* ✅ Mobile-only fixes: desktop unchanged */}
      <style>{`
        @media (max-width: 820px) {
          .wrap {
            padding: 0 6px;
          }
          #parent-dashboard {
            padding: 14px !important;
          }
          .playersGrid {
            grid-template-columns: 1fr !important;
          }
          .playerCard {
            padding: 14px !important;
          }
          .playerCard * {
            max-width: 100%;
          }
        }
      `}</style>

      {/* Mobile Bottom Nav (only shows on small screens) */}
      <div className="mobileNav">
        <button className={`navBtn ${tab === "players" ? "active" : ""}`} onClick={() => setTab("players")}>
          <div className="navIcon">👤</div>
          <div className="navLabel">Players</div>
        </button>

        <button className={`navBtn ${tab === "book" ? "active" : ""}`} onClick={() => setTab("book")}>
          <div className="navIcon">📅</div>
          <div className="navLabel">Book</div>
        </button>

        <button className={`navBtn ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>
          <div className="navIcon">⏳</div>
          <div className="navLabel">Upcoming</div>
        </button>

        <button className={`navBtn ${tab === "account" ? "active" : ""}`} onClick={() => setTab("account")}>
          <div className="navIcon">⚙️</div>
          <div className="navLabel">Account</div>
        </button>
      </div>

      <style>{`
        .mobileNav { display: none; }

        @media (max-width: 820px) {
          .mobileNav {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: 12px;
            height: 66px;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(10px);
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            padding: 8px;
            box-shadow: 0 18px 40px rgba(15,23,42,0.18);
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

          /* make room so content doesn't hide behind the mobile nav */
          #parent-dashboard {
            padding-bottom: 92px !important;
          }
        }
      `}</style>
    </main>
  );
}
