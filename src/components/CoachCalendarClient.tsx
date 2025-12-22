"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BookingNotesEditor from "@/components/BookingNotesEditor";
import AddAvailabilityModal from "@/components/AddAvailabilityModal";

type BookingForCalendar = {
  id: string;
  start: string;
  durationMinutes: number | null;
  lessonType: string | null;
  playerName: string;
  createdAtISO?: string;
  completedAtISO?: string | null;
  paidAtISO?: string | null;
  paymentMethod?: string | null;
};

type AvailabilityForCalendar = {
  id: string;
  start: string; // ISO
  end: string; // ISO
};

type DayInfo = {
  date: Date;
  label: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  key: string;
  weekday: number;
};

type Props = {
  monthISO: string;
  bookings: BookingForCalendar[];
  availability: AvailabilityForCalendar[];
  nowISO: string; // ✅ from server
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function localDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const SLOT_MINUTES = 30;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

function bookingEnd(b: BookingForCalendar) {
  const start = new Date(b.start);
  const mins = b.durationMinutes ?? 60;
  return new Date(start.getTime() + mins * 60 * 1000);
}

function slotsFromAvailabilityBlock(block: AvailabilityForCalendar): { start: Date; end: Date }[] {
  const start = new Date(block.start);
  const end = new Date(block.end);
  const out: { start: Date; end: Date }[] = [];

  for (let t = start.getTime(); t + SLOT_MS <= end.getTime(); t += SLOT_MS) {
    out.push({ start: new Date(t), end: new Date(t + SLOT_MS) });
  }
  return out;
}

export function CoachCalendarClient({ monthISO, bookings, availability, nowISO }: Props) {
  const router = useRouter();

  // ✅ Use the server snapshot (prevents hydration mismatch)
  const now = useMemo(() => new Date(nowISO), [nowISO]);
  const nowMs = useMemo(() => now.getTime(), [now]);

  // ...keep the rest of your component the same


  const [mode, setMode] = useState<"BOOKINGS" | "AVAILABILITY">("BOOKINGS");
  const [localBookings, setLocalBookings] = useState<BookingForCalendar[]>(bookings);
  const [localAvailability, setLocalAvailability] = useState<AvailabilityForCalendar[]>(availability);

  // Filter toggle for bookings
  const [bookingFilter, setBookingFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED">("ALL");

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "UPCOMING") {
      return localBookings.filter((b) => new Date(b.start) >= now);
    }
    if (bookingFilter === "COMPLETED") {
      return localBookings.filter((b) => Boolean(b.completedAtISO));
    }
    return localBookings;
  }, [localBookings, bookingFilter, now]);

  const [selectedBooking, setSelectedBooking] = useState<BookingForCalendar | null>(null);

  // Tooltip
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; text: string }>({
    show: false,
    x: 0,
    y: 0,
    text: "",
  });


  function showTooltip(e: React.MouseEvent, text: string) {
    setTooltip({ show: true, x: e.clientX + 12, y: e.clientY + 12, text });
  }
  function moveTooltip(e: React.MouseEvent) {
    setTooltip((t) => (t.show ? { ...t, x: e.clientX + 12, y: e.clientY + 12 } : t));
  }
  function hideTooltip() {
    setTooltip((t) => ({ ...t, show: false }));
  }

  // Month anchor
  const candidate = monthISO ? new Date(monthISO) : now;
  const monthAnchor = Number.isNaN(candidate.getTime()) ? now : candidate;

  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);

  // Build calendar days list (includes leading/trailing days)
  const days: DayInfo[] = [];

  const firstDayWeekday = monthStart.getDay();

  // Leading days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const d = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      monthStart.getDate() - (i + 1)
    );
    days.push({
      date: d,
      label: d.getDate(),
      isToday: false,
      isCurrentMonth: false,
      key: localDateKey(d),
      weekday: d.getDay(),
    });
  }

  // Current month days
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    days.push({
      date: d,
      label: day,
      isToday,
      isCurrentMonth: true,
      key: localDateKey(d),
      weekday: d.getDay(),
    });
  }

  // Trailing days to complete week
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]!.date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);

    days.push({
      date: d,
      label: d.getDate(),
      isToday: false,
      isCurrentMonth: false,
      key: localDateKey(d),
      weekday: d.getDay(),
    });
  }

  // Index bookings by day
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingForCalendar[]>();
    for (const b of filteredBookings) {
      const key = localDateKey(new Date(b.start));
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    return map;
  }, [filteredBookings]);

  // Index availability by day
  const availabilityByDay = useMemo(() => {
    const map = new Map<string, AvailabilityForCalendar[]>();
    for (const a of localAvailability) {
      const key = localDateKey(new Date(a.start));
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [localAvailability]);

  async function deleteAvailability(id: string) {
    const ok = window.confirm("Delete this availability block?");
    if (!ok) return;

    const r = await fetch("/api/availability/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!r.ok) {
      alert("Failed to delete availability.");
      return;
    }

    setLocalAvailability((prev) => prev.filter((x) => x.id !== id));
  }

  async function handleDropOnDay(bookingId: string, newDay: Date) {
    const ok = window.confirm("Move this lesson to the new day? (Time stays the same)");
    if (!ok) return;

    const r = await fetch("/api/bookings/move-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, newDayISO: newDay.toISOString() }),
    });

    if (!r.ok) {
      alert("Failed to move booking.");
      return;
    }

    router.refresh();
  }

  function addAvailabilityForDay(dayDate: Date) {
    // Use your existing modal
    // If your AddAvailabilityModal expects props, keep it. This just opens it.
    setShowAddModal(true);
    setAddModalDay(dayDate);
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDay, setAddModalDay] = useState<Date | null>(null);

  async function onAvailabilityAdded(newBlocks: AvailabilityForCalendar[]) {
    setLocalAvailability((prev) => [...prev, ...newBlocks]);
  }

  async function markComplete(bookingId: string) {
    const ok = window.confirm("Mark this session as completed?");
    if (!ok) return;

    const completeRes = await fetch("/api/bookings/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });

    if (!completeRes.ok) {
      alert("Failed to mark session as completed.");
      return;
    }

    const completedAtISO = new Date().toISOString();

    setLocalBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, completedAtISO } : b))
    );
    setSelectedBooking((prev) => (prev ? { ...prev, completedAtISO } : prev));
  }

  async function markPaid(bookingId: string, defaultMethod?: string | null) {
    const method =
      window.prompt(
        "Payment method? (Cash / Venmo / Cash App / Apple Pay)",
        defaultMethod ?? "Cash"
      ) || "Cash";

    const paidRes = await fetch("/api/bookings/paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, paymentMethod: method }),
    });

    if (!paidRes.ok) {
      alert("Failed to mark as paid.");
      return;
    }

    const payload = await paidRes.json(); // { booking: {...} }

    const paidAtISO = payload?.booking?.paidAt
      ? new Date(payload.booking.paidAt).toISOString()
      : new Date().toISOString();

    const paymentMethod = payload?.booking?.paymentMethod ?? method;

    setLocalBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, paidAtISO, paymentMethod } : b))
    );
    setSelectedBooking((prev) => (prev ? { ...prev, paidAtISO, paymentMethod } : prev));
  }

  async function handleChangeTime(_bookingId: string) {
    alert("Change Time is wired in your existing code — keep your current implementation here.");
  }

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 30px rgba(17,24,39,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setMode("BOOKINGS")}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: mode === "BOOKINGS" ? "#111827" : "#fff",
              color: mode === "BOOKINGS" ? "#fff" : "#111827",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Bookings
          </button>
          <button
            type="button"
            onClick={() => setMode("AVAILABILITY")}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: mode === "AVAILABILITY" ? "#111827" : "#fff",
              color: mode === "AVAILABILITY" ? "#fff" : "#111827",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Availability
          </button>
        </div>

        {mode === "BOOKINGS" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setBookingFilter("ALL")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: bookingFilter === "ALL" ? "#111827" : "#fff",
                color: bookingFilter === "ALL" ? "#fff" : "#111827",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setBookingFilter("UPCOMING")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: bookingFilter === "UPCOMING" ? "#111827" : "#fff",
                color: bookingFilter === "UPCOMING" ? "#fff" : "#111827",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setBookingFilter("COMPLETED")}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: bookingFilter === "COMPLETED" ? "#111827" : "#fff",
                color: bookingFilter === "COMPLETED" ? "#fff" : "#111827",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Completed
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
            Click a day to add availability · click green to delete · red means booked
          </div>
        )}
      </div>

     {/* Calendar Grid */}
<div
  className="calGrid"
  style={{
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)", // ✅ desktop unchanged
    gap: 6,
  }}
>
  {days.map((day) => {
    const dayBookings = bookingsByDay.get(day.key) ?? [];
    const dayAvail = availabilityByDay.get(day.key) ?? [];

    return (
      <div
        key={day.key}
        className="calDay"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          if (mode !== "BOOKINGS") return;
          const bookingId = e.dataTransfer.getData("text/plain");
          if (bookingId) handleDropOnDay(bookingId, day.date);
        }}
        onClick={() => {
          if (mode === "AVAILABILITY" && day.isCurrentMonth) addAvailabilityForDay(day.date);
        }}
        style={{
          minHeight: 110,
          borderRadius: 10,
          padding: 6,
          border: "1px solid #e5e7eb",
          background: day.isCurrentMonth ? "#ffffff" : "#f9fafb",
          opacity: day.isCurrentMonth ? 1 : 0.45,
          cursor: mode === "AVAILABILITY" && day.isCurrentMonth ? "pointer" : "default",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            marginBottom: 4,
            color: day.isToday ? "#2563eb" : "#111827",
          }}
        >
          {day.label}
        </div>

        {/* AVAILABILITY mode (render 30-min slots as green/red) */}
        {mode === "AVAILABILITY" ? (
          <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
            {dayAvail.flatMap((block) => slotsFromAvailabilityBlock(block)).map((slot, i) => {
              const slotStart = slot.start;
              const slotEnd = slot.end;

              const booked = localBookings.find((b) => {
                const bStart = new Date(b.start);
                const bEnd = bookingEnd(b);
                return overlaps(slotStart, slotEnd, bStart, bEnd);
              });

              const isBooked = Boolean(booked);

              return (
                <button
                  key={`${day.key}-${i}-${slotStart.toISOString()}`}
                  type="button"
                  className="calSlotBtn"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (isBooked && booked) {
                      setSelectedBooking(booked);
                      return;
                    }
                    const matchBlock = dayAvail.find((b) => {
                      const bs = new Date(b.start);
                      const be = new Date(b.end);
                      return slotStart >= bs && slotEnd <= be;
                    });
                    if (matchBlock) deleteAvailability(matchBlock.id);
                  }}
                  style={{
                    textAlign: "left",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                    background: isBooked ? "#dc2626" : "#16a34a",
                    boxShadow: isBooked
                      ? "0 10px 20px rgba(220,38,38,0.18)"
                      : "0 10px 20px rgba(22,163,74,0.18)",
                  }}
                  title={isBooked ? `BOOKED: ${booked?.playerName ?? ""}` : "Available"}
                >
                  {fmtTime(slotStart)}–{fmtTime(slotEnd)} · {isBooked ? "Booked" : "Available"}
                </button>
              );
            })}
          </div>
        ) : (
          /* BOOKINGS mode */
          <div style={{ marginTop: 6 }}>
            {dayBookings.map((b) => {
              const isNew =
                b.createdAtISO && nowMs - new Date(b.createdAtISO).getTime() < 24 * 60 * 60 * 1000;

              const isCompleted = Boolean(b.completedAtISO);
              const isPaid = Boolean(b.paidAtISO);

              return (
                <div
                  key={b.id}
                  className="calBookingChip"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedBooking(b);
                  }}
                  onMouseEnter={(e) =>
                    showTooltip(
                      e,
                      `${b.playerName} • ${fmtTime(new Date(b.start))} • ${
                        b.durationMinutes ?? "?"
                      } min • ${b.lessonType ?? "Lesson"}`
                    )
                  }
                  onMouseMove={moveTooltip}
                  onMouseLeave={hideTooltip}
                  style={{
                    fontSize: 11,
                    padding: "4px 6px",
                    borderRadius: 8,
                    marginBottom: 4,
                    cursor: "pointer",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 900,
                  }}
                >
                  {fmtTime(new Date(b.start))} · {b.playerName} {isNew ? "🆕" : ""}{" "}
                  {b.completedAtISO ? "✓" : ""}
                  {b.paidAtISO ? " 💰" : ""}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
</div>

{/* ✅ Mobile-only tweaks (desktop unchanged) */}
<style jsx>{`
  @media (max-width: 820px) {
    .calGrid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }
    .calDay {
      min-height: 120px !important;
      padding: 10px !important;
      border-radius: 14px !important;
    }
    .calBookingChip {
      padding: 8px 10px !important;
      border-radius: 12px !important;
      margin-bottom: 8px !important;
      font-size: 12px !important;
    }
    .calSlotBtn {
      padding: 10px 10px !important;
      border-radius: 12px !important;
      font-size: 12px !important;
    }
  }
`}</style>

      {/* Selected booking panel */}
      {selectedBooking && (
        <div
          style={{
            marginTop: 16,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              gap: 10,
            }}
          >
            <strong>
              {selectedBooking.playerName} · {new Date(selectedBooking.start).toLocaleString()}
            </strong>

            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
            Lesson type: {selectedBooking.lessonType ?? "—"} · {selectedBooking.durationMinutes ?? "?"}{" "}
            min
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800, marginBottom: 10 }}>
            {selectedBooking.paidAtISO ? (
              <>Paid: {new Date(selectedBooking.paidAtISO).toLocaleString()} ({selectedBooking.paymentMethod ?? "—"})</>
            ) : (
              <>Not paid yet</>
            )}
          </div>

          <BookingNotesEditor bookingId={selectedBooking.id} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button
              type="button"
              onClick={() => markComplete(selectedBooking.id)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #16a34a",
                background: "#16a34a",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ✓ Mark Session Complete
            </button>

            <button
              type="button"
              onClick={() => markPaid(selectedBooking.id, selectedBooking.paymentMethod)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #111827",
                background: "#111827",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              💰 Mark Paid
            </button>

            <button
              type="button"
              onClick={() => handleChangeTime(selectedBooking.id)}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Change Time
            </button>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 9999,
            background: "rgba(17,24,39,0.95)",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            maxWidth: 280,
            lineHeight: 1.25,
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Add Availability Modal */}
      {showAddModal && addModalDay && (
  <AddAvailabilityModal
    open={showAddModal}
    dateLabel={addModalDay.toLocaleDateString()}
    onClose={() => setShowAddModal(false)}
    onSave={async (startTime24: string, endTime24: string) => {
      // startTime24 and endTime24 are like "15:30"
      const [sh, sm] = startTime24.split(":").map(Number);
      const [eh, em] = endTime24.split(":").map(Number);

      const start = new Date(addModalDay);
      start.setHours(sh, sm, 0, 0);

      const end = new Date(addModalDay);
      end.setHours(eh, em, 0, 0);

      // basic guard
      if (end <= start) {
        alert("End time must be after start time.");
        return;
      }

      const payload = {
  dayISO: addModalDay instanceof Date ? addModalDay.toISOString() : new Date(addModalDay).toISOString(),
  startTime24,
  endTime24,
};

const res = await fetch("/api/availability/add", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const msg = await res.text().catch(() => "");
  alert(`Failed to add availability.${msg ? `\n\n${msg}` : ""}`);
  return;
}


if (!res.ok) {
  const txt = await res.text(); // show server error details
  alert(`Failed to add availability:\n${txt}`);
  return;
}


      // update local UI
      const data = await res.json();
      // Expecting API returns { block: { id, start, end } } or similar.
      // If your API returns a different shape, tell me what it returns and I’ll match it.
      const newBlock = data.block ?? data.availability ?? null;

      if (newBlock?.id && newBlock?.start && newBlock?.end) {
        setLocalAvailability((prev) => [
          ...prev,
          { id: newBlock.id, start: newBlock.start, end: newBlock.end },
        ]);
      } else {
        // fallback: refresh if response shape differs
        router.refresh();
      }

      setShowAddModal(false);
    }}
        />
      )}
    </section>
  );
}
