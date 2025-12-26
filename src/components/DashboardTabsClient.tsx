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
  endISO: string;
  lessonType: string | null;
  durationMinutes: number | null;
  notes: string | null;
  completedAtISO: string | null;
  paidAtISO: string | null;
  paymentMethod: string | null;
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

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "red" | "gray" | "blue" }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
    red: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
    gray: { bg: "#f9fafb", border: "#e5e7eb", text: "#374151" },
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  };

  const c = colors[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function DashboardTabsClient(props: {
  parentName: string;
  players: PlayerCard[];
  upcomingBookings: BookingRow[];
}) {
  const [tab, setTab] = useState<"players" | "book" | "upcoming" | "account">("players");
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  useEffect(() => {
    if (tabFromUrl === "upcoming") setTab("upcoming");
  }, [tabFromUrl]);

  const nowMs = useMemo(() => Date.now(), []);

  const bookingsSorted = useMemo(() => {
    return [...props.upcomingBookings].sort(
      (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
    );
  }, [props.upcomingBookings]);

  const [bookingView, setBookingView] = useState<"UPCOMING" | "COMPLETED" | "ALL">("UPCOMING");

  const bookingsFiltered = useMemo(() => {
    if (bookingView === "ALL") return bookingsSorted;

    if (bookingView === "COMPLETED") {
      return bookingsSorted.filter((b) => Boolean(b.completedAtISO));
    }

    // UPCOMING
    return bookingsSorted.filter((b) => new Date(b.endISO).getTime() >= nowMs);
  }, [bookingsSorted, bookingView, nowMs]);

  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
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
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Parent Dashboard</h1>
            <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13 }}>
              Signed in as <b>{props.parentName}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                        {(p.school ?? "—") +
                          " · " +
                          (p.classYear ?? "—") +
                          (p.gradYear ? ` · Class of ${p.gradYear}` : "")}
                      </div>
                    </div>
                  </div>

                  <div className="metricsRow" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    <MetricMini label="Tee" value={p.metrics?.teeExitVelo != null ? `${p.metrics.teeExitVelo} mph` : "-"} />
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
                No players yet. Click <b>+ Add Player</b> at the top to create your first profile.
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
                const isCompleted = Boolean(b.completedAtISO);
                const isPaid = Boolean(b.paidAtISO);

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
                        <Badge tone={isCompleted ? "green" : "blue"}>{isCompleted ? "Completed" : "Scheduled"}</Badge>
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
                  </div>
                );
              })}

              {bookingsFiltered.length === 0 ? (
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  No lessons found for this view.
                </div>
              ) : null}
            </div>
          </section>
        )}

        {/* ACCOUNT */}
        {tab === "account" && (
          <section style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Account</div>

            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
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
        }
      `}</style>
    </main>
  );
}
