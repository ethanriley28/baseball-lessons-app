"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * IMPORTANT:
 * Your /book page already fetches “slots” from some API endpoint.
 * Set this constant to the SAME endpoint your /book page uses.
 *
 * If your /book page fetch is something like:
 *   fetch("/api/availability/slots?playerId=...&days=14")
 * then keep it as "/api/availability/slots".
 *
 * If it’s different, change this ONE constant.
 */
const RESCHEDULE_SLOTS_ENDPOINT = "/api/availability/slots";

/** UI helpers */
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

function Badge({
  tone,
  children,
}: {
  tone: "green" | "blue" | "red" | "gray";
  children: React.ReactNode;
}) {
  const map: Record<string, React.CSSProperties> = {
    green: { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" },
    blue: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" },
    red: { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" },
    gray: { background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151" },
  };
  return (
    <span
      style={{
        ...map[tone],
        fontSize: 12,
        fontWeight: 900,
        padding: "6px 10px",
        borderRadius: 9999,
      }}
    >
      {children}
    </span>
  );
}

/** Types */
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
  completedAtISO?: string | null;
  paidAtISO?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  player: { id: string; name: string };
};

type RescheduleSlot = {
  id: string;
  startISO: string;
  endISO?: string;
  labelTime?: string;
  labelDate?: string;
};

export default function DashboardTabsClient(props: {
  parentName: string;
  players: PlayerCard[];
  upcomingBookings: BookingRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"players" | "book" | "upcoming" | "account">("players");
  const [bookingView, setBookingView] = useState<"UPCOMING" | "COMPLETED" | "ALL">("UPCOMING");

  // keep bookings in state so cancel/reschedule updates UI immediately
  const [bookings, setBookings] = useState<BookingRow[]>(props.upcomingBookings || []);

  // handle URL tab param if you use it
  const tabFromUrl = searchParams.get("tab");
  useEffect(() => {
    if (tabFromUrl === "upcoming") setTab("upcoming");
    if (tabFromUrl === "players") setTab("players");
    if (tabFromUrl === "account") setTab("account");
    if (tabFromUrl === "book") setTab("book");
  }, [tabFromUrl]);

  // ✅ Cancel flow
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function cancelLesson(bookingId: string) {
    const ok = window.confirm("Cancel this lesson? This will free the time back up.");
    if (!ok) return;

    setCancellingId(bookingId);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Failed to cancel lesson.${txt ? `\n\n${txt}` : ""}`);
        return;
      }

      // remove from UI immediately (or mark cancelled)
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));

      // refresh server components (coach calendar + any server-rendered views)
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Network error cancelling lesson.");
    } finally {
      setCancellingId(null);
    }
  }

  // ✅ Reschedule flow (parent side)
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const [rescheduleBookingId, setRescheduleBookingId] = useState<string>("");
  const [reschedulePlayerId, setReschedulePlayerId] = useState<string>("");
  const [reschedulePlayerLabel, setReschedulePlayerLabel] = useState<string>("");

  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduleSlots, setRescheduleSlots] = useState<RescheduleSlot[]>([]);
  const [rescheduleStartISO, setRescheduleStartISO] = useState<string>(""); // ✅ THIS FIXES YOUR BUILD ERRORS

  function openRescheduleModal(b: BookingRow) {
    setRescheduleBookingId(b.id);
    setReschedulePlayerId(b.player.id);
    setReschedulePlayerLabel(`${b.player.name} · ${b.lessonType ?? "Lesson"} (${fmtDT(b.startISO)})`);
    setRescheduleOpen(true);
    setRescheduleSlots([]);
    setRescheduleStartISO("");
  }

  // Fetch available slots when modal opens
  useEffect(() => {
    if (!rescheduleOpen || !reschedulePlayerId) return;

    (async () => {
      setLoadingRescheduleSlots(true);
      setRescheduleSlots([]);
      setRescheduleStartISO("");

      try {
        // NOTE: This must match what your /book page uses.
        // Common patterns:
        //   /api/availability/slots?playerId=XXX&days=14
        //   /api/availability/slots?days=14
        // If your endpoint doesn't need playerId, it will just ignore it.
        const url = `${RESCHEDULE_SLOTS_ENDPOINT}?playerId=${encodeURIComponent(reschedulePlayerId)}&days=14`;

        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.warn("Reschedule slots fetch failed:", txt);
          setRescheduleSlots([]);
          return;
        }

        const data = await res.json().catch(() => null);

        // Accept a few common shapes:
        // 1) { slots: [...] }
        // 2) [...] directly
        const rawSlots: any[] = Array.isArray(data) ? data : Array.isArray(data?.slots) ? data.slots : [];

        // Normalize to { id, startISO, labelTime, labelDate }
        const normalized: RescheduleSlot[] = rawSlots
          .map((s: any) => {
            const startISO = s?.startISO ?? s?.start ?? s?.start_time ?? null;
            if (!startISO) return null;

            const id = s?.id ?? startISO;
            const endISO = s?.endISO ?? s?.end ?? null;

            // If API already provides labelTime/labelDate, use them; else create.
            const d = new Date(startISO);
            const labelTime =
              s?.labelTime ??
              d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

            const labelDate =
              s?.labelDate ??
              d.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" });

            return { id, startISO, endISO, labelTime, labelDate };
          })
          .filter(Boolean) as RescheduleSlot[];

        setRescheduleSlots(normalized);
      } catch (e) {
        console.error(e);
        setRescheduleSlots([]);
      } finally {
        setLoadingRescheduleSlots(false);
      }
    })();
  }, [rescheduleOpen, reschedulePlayerId]);

  async function submitReschedule() {
    if (!rescheduleBookingId) return;
    if (!rescheduleStartISO) {
      alert("Pick a new time first.");
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

      // refresh everything
      setRescheduleOpen(false);
      setRescheduleSlots([]);
      setRescheduleStartISO("");
      router.refresh();

      // Optional: also force local bookings refresh by reloading page
      // window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Network error rescheduling.");
    } finally {
      setRescheduling(false);
    }
  }

  const upcomingSorted = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
    );
  }, [bookings]);

  const bookingsFiltered = useMemo(() => {
    // treat CANCELLED as not shown
    const visible = upcomingSorted.filter((b) => (b.status ?? "CONFIRMED") !== "CANCELLED");

    if (bookingView === "ALL") return visible;

    if (bookingView === "COMPLETED") {
      return visible.filter((b) => Boolean(b.completedAtISO));
    }

    // UPCOMING default
    return visible.filter((b) => !b.completedAtISO);
  }, [upcomingSorted, bookingView]);

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
            <button style={pillStyle(tab === "players")} onClick={() => setTab("players")}>
              Players
            </button>
            <button style={pillStyle(tab === "book")} onClick={() => setTab("book")}>
              Book
            </button>
            <button style={pillStyle(tab === "upcoming")} onClick={() => setTab("upcoming")}>
              Upcoming
            </button>
            <button style={pillStyle(tab === "account")} onClick={() => setTab("account")}>
              Account
            </button>
          </div>
        </div>

        {/* PLAYERS */}
        {tab === "players" && (
          <section style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Players</div>
            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
              Manage your players. (You already have this working.)
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {props.players.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 14,
                    background: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                      {p.school ? `${p.school}` : "—"}
                      {p.position ? ` · ${p.position}` : ""}
                    </div>
                  </div>

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
              ))}

              {props.players.length === 0 ? (
                <div style={{ fontSize: 14, color: "#6b7280" }}>No players yet.</div>
              ) : null}
            </div>
          </section>
        )}

        {/* BOOK */}
        {tab === "book" && (
          <section style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Book</div>
            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
              Booking happens on the Book page.
            </div>

            <div style={{ marginTop: 14 }}>
              <Link
                href="/book"
                style={{
                  textDecoration: "none",
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 900,
                  padding: "12px 14px",
                  borderRadius: 14,
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
                          onClick={() => openRescheduleModal(b)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 12,
                            border: "1px solid #111827",
                            background: "#111827",
                            color: "#fff",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          Reschedule
                        </button>

                        <button
                          type="button"
                          disabled={cancellingId === b.id}
                          onClick={() => cancelLesson(b.id)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 12,
                            border: "1px solid #ef4444",
                            background: "#fff",
                            color: "#ef4444",
                            fontWeight: 900,
                            cursor: cancellingId === b.id ? "not-allowed" : "pointer",
                            opacity: cancellingId === b.id ? 0.6 : 1,
                          }}
                        >
                          {cancellingId === b.id ? "Cancelling..." : "Cancel"}
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
            <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
              More settings can go here later.
            </div>

            <div style={{ marginTop: 14 }}>
              <Link
                href="/"
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
                Home
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ✅ Reschedule Modal */}
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
              width: "min(620px, 100%)",
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              padding: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 900, fontSize: 16, color: "#111827" }}>
              Reschedule Lesson
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.35 }}>
              {reschedulePlayerLabel}
              <br />
              Pick a new time from coach availability.
            </div>

            <div style={{ marginTop: 12 }}>
              {loadingRescheduleSlots ? (
                <div style={{ fontSize: 14, color: "#6b7280" }}>Loading available times…</div>
              ) : rescheduleSlots.length === 0 ? (
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  No available times. (If you KNOW you have availability, your reschedule endpoint doesn’t match your
                  /book endpoint — update <b>RESCHEDULE_SLOTS_ENDPOINT</b> at the top of this file.)
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {/* group by labelDate */}
                  {Object.entries(
                    rescheduleSlots.reduce((acc: Record<string, RescheduleSlot[]>, s) => {
                      const k = s.labelDate ?? "Available";
                      acc[k] = acc[k] || [];
                      acc[k].push(s);
                      return acc;
                    }, {})
                  ).map(([dateLabel, list]) => (
                    <div
                      key={dateLabel}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 12,
                        background: "#f9fafb",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 8 }}>{dateLabel}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {list.map((slot) => {
                          const isSelected = rescheduleStartISO === slot.startISO;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setRescheduleStartISO(slot.startISO)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                border: "1px solid #d1d5db",
                                background: isSelected ? "#111827" : "#fff",
                                color: isSelected ? "#fff" : "#111827",
                                fontWeight: 900,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              {slot.labelTime ?? fmtDT(slot.startISO)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
    </main>
  );
}
