"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  endISO?: string | null;
  lessonType: string | null;
  durationMinutes: number | null;
  notes: string | null;
  completedAtISO?: string | null;
  paidAtISO?: string | null;
  paymentMethod?: string | null;
  status?: string | null; // CONFIRMED / CANCELLED etc
  player: { id: string; name: string };
};

type RescheduleSlot = {
  startISO: string;
  labelTime: string;
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
  tone: "green" | "blue" | "red" | "gray";
}) {
  const map = {
    green: { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
    blue: { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
    red: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
    gray: { bg: "#f9fafb", text: "#374151", border: "#e5e7eb" },
  }[tone];

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 900,
        padding: "6px 10px",
        borderRadius: 9999,
        background: map.bg,
        color: map.text,
        border: `1px solid ${map.border}`,
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"players" | "book" | "upcoming" | "account">("players");
  const tabFromUrl = searchParams.get("tab");

  useEffect(() => {
    if (tabFromUrl === "upcoming") setTab("upcoming");
    if (tabFromUrl === "players") setTab("players");
    if (tabFromUrl === "book") setTab("book");
    if (tabFromUrl === "account") setTab("account");
  }, [tabFromUrl]);

  // Keep bookings in state so cancel/reschedule updates UI immediately
  const [bookings, setBookings] = useState<BookingRow[]>(props.upcomingBookings ?? []);
  useEffect(() => {
    setBookings(props.upcomingBookings ?? []);
  }, [props.upcomingBookings]);

  const [bookingView, setBookingView] = useState<"UPCOMING" | "COMPLETED" | "ALL">("UPCOMING");

  const upcomingSorted = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
    );
  }, [bookings]);

  const bookingsFiltered = useMemo(() => {
    const now = Date.now();
    const nonCancelled = upcomingSorted.filter((b) => (b.status ?? "CONFIRMED") !== "CANCELLED");

    if (bookingView === "ALL") return nonCancelled;

    if (bookingView === "COMPLETED") {
      return nonCancelled.filter(
        (b) => Boolean(b.completedAtISO) || new Date(b.startISO).getTime() < now
      );
    }

    return nonCancelled.filter((b) => new Date(b.startISO).getTime() >= now && !b.completedAtISO);
  }, [upcomingSorted, bookingView]);

  async function cancelLesson(bookingId: string) {
    const ok = confirm("Cancel this lesson? This will free up the slot again.");
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

      // remove immediately from UI
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));

      // refresh server components too
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Network error cancelling lesson.");
    }
  }

  // -------------------- RESCHEDULE STATE --------------------
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string>("");
  const [reschedulePlayerLabel, setReschedulePlayerLabel] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState(""); // YYYY-MM-DD
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlot[]>([]);
  const [rescheduleStartISO, setRescheduleStartISO] = useState("");
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  function openReschedule(booking: BookingRow) {
    setRescheduleBookingId(booking.id);
    setReschedulePlayerLabel(`${booking.player?.name ?? "Player"} · ${booking.lessonType ?? "Lesson"}`);

    // default date = booking day (local)
    const d = new Date(booking.startISO);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setRescheduleDate(`${yyyy}-${mm}-${dd}`);

    setRescheduleSlots([]);
    setRescheduleStartISO("");
    setRescheduleOpen(true);
  }

  async function loadRescheduleSlots(dateKey: string, durationMinutes: number) {
    if (!dateKey) return;

    setLoadingRescheduleSlots(true);
    setRescheduleSlots([]);
    setRescheduleStartISO("");

    try {
      // IMPORTANT: this must match what your /book page uses
      const url = `/api/availability/slots?date=${encodeURIComponent(dateKey)}&duration=${durationMinutes}`;
      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("loadRescheduleSlots failed:", txt);
        setRescheduleSlots([]);
        return;
      }

      const data = await res.json();
      const slots = Array.isArray(data?.slots) ? data.slots : [];

      setRescheduleSlots(
        slots
          .filter((s: any) => s?.startISO && s?.labelTime)
          .map((s: any) => ({ startISO: s.startISO, labelTime: s.labelTime }))
      );
    } catch (e) {
      console.error(e);
      setRescheduleSlots([]);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  }

  useEffect(() => {
    if (!rescheduleOpen) return;
    if (!rescheduleDate) return;

    const booking = bookings.find((b) => b.id === rescheduleBookingId);
    const duration = booking?.durationMinutes ?? 60;

    loadRescheduleSlots(rescheduleDate, duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescheduleOpen, rescheduleDate, rescheduleBookingId]);

  async function submitReschedule() {
    if (!rescheduleBookingId) return;

    if (!rescheduleStartISO) {
      alert("Pick an available time.");
      return;
    }

    setRescheduling(true);
    try {
      const res = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: rescheduleBookingId,
          newStartISO: rescheduleStartISO,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Failed to reschedule.${txt ? `\n\n${txt}` : ""}`);
        return;
      }

      // safest: close modal and refresh server data
      setRescheduleOpen(false);
      setRescheduleBookingId("");
      setReschedulePlayerLabel("");
      setRescheduleDate("");
      setRescheduleSlots([]);
      setRescheduleStartISO("");

      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Network error rescheduling.");
    } finally {
      setRescheduling(false);
    }
  }

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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/players/new"
              style={{
                textDecoration: "none",
                background: "#111827",
                color: "#fff",
                fontWeight: 900,
                padding: "10px 12px",
                borderRadius: 12,
                display: "inline-block",
              }}
            >
              + Add Player
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

                  <div
                    className="metricsRow"
                    style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}
                  >
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
                      <b>{fmtDT(b.startISO)}</b>
                      {b.endISO ? <> → {fmtDT(b.endISO)}</> : null}
                      {b.durationMinutes ? ` · ${b.durationMinutes} min` : null}
                    </div>

                    {b.notes ? (
                      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.35 }}>
                        <b>Notes:</b> {b.notes}
                      </div>
                    ) : null}

                    {!isCompleted ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => openReschedule(b)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 12,
                            border: "1px solid #2563eb",
                            background: "#fff",
                            color: "#2563eb",
                            fontWeight: 900,
                            cursor: "pointer",
                            width: "fit-content",
                          }}
                        >
                          Reschedule
                        </button>

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
              Manage your profile and settings.
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

      {/* Mobile-only: stack player cards */}
      <style>{`
        @media (max-width: 820px) {
          .playersGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Reschedule Modal */}
      {rescheduleOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setRescheduleOpen(false)}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              padding: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>Reschedule Lesson</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.35 }}>
              {reschedulePlayerLabel}
              <br />
              Pick a new date/time that fits coach availability.
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>Date</div>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 16,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>Available Times</div>

                {loadingRescheduleSlots ? (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Loading...</div>
                ) : rescheduleSlots.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>No available times for this date.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {rescheduleSlots.map((s) => {
                      const selected = rescheduleStartISO === s.startISO;

                      return (
                        <button
                          key={s.startISO}
                          type="button"
                          onClick={() => setRescheduleStartISO(s.startISO)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid #d1d5db",
                            background: selected ? "#111827" : "#fff",
                            color: selected ? "#fff" : "#111827",
                            fontWeight: 900,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          {s.labelTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setRescheduleOpen(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#111827",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={submitReschedule}
                disabled={rescheduling}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #111827",
                  background: rescheduling ? "#9ca3af" : "#111827",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: rescheduling ? "not-allowed" : "pointer",
                }}
              >
                {rescheduling ? "Saving..." : "Save New Time"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
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
          .navIcon { font-size: 18px; line-height: 1; }
          .navLabel { font-size: 11px; line-height: 1; opacity: 0.9; }
        }
      `}</style>
    </main>
  );
}
