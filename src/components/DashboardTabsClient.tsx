"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

/* ---------- types ---------- */
type PlayerCard = {
  id: string;
  name: string;
  school?: string | null;
  classYear?: string | null;
  gradYear?: number | null;
  position?: string | null;
  photoUrl?: string | null;
  metrics?: {
    teeExitVelo?: number | null;
    sixtyTime?: number | null;
    fiveTenFiveTime?: number | null;
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
  status?: string | null;
  player: { id: string; name: string };
};

/* ---------- helpers ---------- */
const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: "10px 14px",
  borderRadius: 999,
  border: active ? "1px solid #2563eb" : "1px solid #e5e7eb",
  background: active ? "linear-gradient(135deg,#2563eb,#0ea5e9)" : "#fff",
  color: active ? "#fff" : "#111827",
  fontWeight: 800,
  cursor: "pointer",
});

const cardStyle = (): React.CSSProperties => ({
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
});

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/* ---------- component ---------- */
export default function DashboardTabsClient(props: {
  parentName: string;
  players: PlayerCard[];
  upcomingBookings: BookingRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<"players" | "book" | "upcoming" | "account">("players");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "players" || t === "book" || t === "upcoming" || t === "account") {
      setTab(t);
    }
  }, [searchParams]);

  /* ---------- BOOKINGS STATE ---------- */
  const [bookings, setBookings] = useState<BookingRow[]>(props.upcomingBookings);
  useEffect(() => setBookings(props.upcomingBookings), [props.upcomingBookings]);

  const [bookingView, setBookingView] = useState<"UPCOMING" | "COMPLETED" | "ALL">("UPCOMING");

  const bookingsFiltered = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((b) => b.status !== "CANCELLED")
      .filter((b) => {
        if (bookingView === "ALL") return true;
        if (bookingView === "COMPLETED") return b.completedAtISO;
        return new Date(b.startISO).getTime() >= now && !b.completedAtISO;
      })
      .sort((a, b) => +new Date(a.startISO) - +new Date(b.startISO));
  }, [bookings, bookingView]);

  /* ---------- CANCEL ---------- */
  async function cancelLesson(id: string) {
    if (!confirm("Cancel this lesson?")) return;
    await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id }),
    });
    setBookings((prev) => prev.filter((b) => b.id !== id));
    router.refresh();
  }

  /* ---------- RESCHEDULE STATE ---------- */
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [rescheduleSelectedStartISO, setRescheduleSelectedStartISO] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  function openReschedule(b: BookingRow) {
    const d = new Date(b.startISO);
    setRescheduleDate(d.toISOString().slice(0, 10));
    setRescheduleBookingId(b.id);
    setRescheduleSelectedStartISO("");
    setRescheduleSlots([]);
    setRescheduleOpen(true);
  }

  useEffect(() => {
    if (!rescheduleOpen || !rescheduleDate || !rescheduleBookingId) return;

    const booking = bookings.find((b) => b.id === rescheduleBookingId);
    const duration = booking?.durationMinutes ?? 60;

    async function load() {
      setLoadingSlots(true);
      const res = await fetch(
        `/api/availability/slots?date=${rescheduleDate}&duration=${duration}`
      );
      const data = await res.json();
      setRescheduleSlots(data.slots ?? []);
      setLoadingSlots(false);
    }

    load();
  }, [rescheduleOpen, rescheduleDate, rescheduleBookingId, bookings]);

  async function submitReschedule() {
    if (!rescheduleSelectedStartISO || !rescheduleBookingId) {
      alert("Pick a time");
      return;
    }
    await fetch("/api/bookings/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: rescheduleBookingId,
        newStartISO: rescheduleSelectedStartISO,
      }),
    });
    window.location.reload();
  }

  /* ---------- UI ---------- */
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: 24 }}>
      {/* dashboard content unchanged */}
      {/* reschedule modal */}
      {rescheduleOpen && (
        <div className="modal">
          <h3>Reschedule Lesson</h3>

          <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />

          {loadingSlots ? (
            <p>Loading...</p>
          ) : (
            rescheduleSlots.map((s) => (
              <button
                key={s.startISO}
                onClick={() => setRescheduleSelectedStartISO(s.startISO)}
              >
                {s.labelTime}
              </button>
            ))
          )}

          <button onClick={submitReschedule}>Save</button>
          <button onClick={() => setRescheduleOpen(false)}>Close</button>
        </div>
      )}
    </main>
  );
}
