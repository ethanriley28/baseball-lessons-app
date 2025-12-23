"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";



type Slot = {
  id: string;
  dateKey: string;
  labelDate: string;
  labelTime: string;
  startISO: string;
};
function formatLocalTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLocalDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

function ConfirmButton({ canConfirm }: { canConfirm: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!canConfirm || pending}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #111827",
        background: !canConfirm || pending ? "#9ca3af" : "#111827",
        color: "#fff",
        fontWeight: 900,
        cursor: !canConfirm || pending ? "not-allowed" : "pointer",
      }}
    >
      {pending ? "Booking..." : "Confirm Booking"}
    </button>
  );
}


export default function BookClient({
  players,
  slots,
  action,
}: {
  players: { id: string; name: string }[];
  slots: Slot[];
  action: (formData: FormData) => void;
}) {
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const confirmRef = useRef<HTMLDivElement | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<"30" | "60">("60");


useEffect(() => {
  if (selectedStart) {
    confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}, [selectedStart]);


  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const list = map.get(s.dateKey) ?? [];
      list.push(s);
      map.set(s.dateKey, list);
    }
    return Array.from(map.entries());
  }, [slots]);
 
    const canConfirm = Boolean(selectedPlayerId) && Boolean(selectedStart);

  return (
    <form
      action={action}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        background: "#fff",
        fontSize: 13,
      }}
    >
       <input type="hidden" name="slotStart" value={selectedStart ?? ""} />

      {/* Top row: 3 aligned fields */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
          alignItems: "start",
          marginBottom: 14,
        }}
      >
        {/* Player */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Player
          </label>
          <select
            name="playerId"
            required
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              background: "#fff",
            }}
          >
            <option value="">Select player</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lesson type */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Lesson Type
          </label>
          <select
            name="lessonType"
            required
            defaultValue="Hitting"
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              background: "#fff",
            }}
          >
            <option value="Hitting">Hitting</option>
            <option value="Fielding">Fielding</option>
            <option value="Speed & Agility">Speed &amp; Agility</option>
            <option value="Strength Training">Strength Training</option>
          </select>
        </div>

        {/* Session length */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Session Length
          </label>
          <select
  name="durationMinutes"
  required
  value={durationMinutes}
  onChange={(e) => setDurationMinutes(e.target.value as "30" | "60")}
  style={{
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    background: "#fff",
  }}
>
  <option value="30">30 minutes</option>
  <option value="60">60 minutes</option>
</select>

          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
            60-min sessions require two back-to-back 30-min slots.
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, marginTop: 8, color: "#111827" }}>
  Price: {durationMinutes === "30" ? "$30" : "$40"}
</div>
<div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
  Payment due at session · Accepted: Cash, Venmo, Cash App, Apple Pay
</div>



      {/* Slots */}
      <div style={{ display: "grid", gap: 12 }}>
        {slotsByDate.map(([dateKey, daySlots]) => (
          <div
            key={dateKey}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              background: "#f9fafb",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 12, marginBottom: 8 }}>
              {daySlots[0]?.labelDate}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {daySlots.map((slot) => {
                const isSelected = selectedStart === slot.startISO;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => {
                      if (!selectedPlayerId) return;
                      setSelectedStart(slot.startISO);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid #d1d5db",
                      background: isSelected ? "#111827" : "#fff",
                      color: isSelected ? "#fff" : "#111827",
                      fontWeight: 900,
                      fontSize: 12,
                      cursor: selectedPlayerId ? "pointer" : "not-allowed",
                      opacity: selectedPlayerId ? 1 : 0.45,
                    }}
                  >
                    {slot.labelTime}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10 }}>
        Times are shown in your local timezone.
      </div>

      {/* Confirm row */}
      <div
  ref={confirmRef}
  style={{
    marginTop: 14,
    display: "flex",
    gap: 10,
    alignItems: "center",
  }}
>

        <ConfirmButton canConfirm={canConfirm} />


        {selectedStart ? (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Selected:{" "}
            <b>
              {new Date(selectedStart).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </b>
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Pick a time slot to continue.
          </span>
        )}
      </div>

      {/* Mobile layout */}
      <style jsx>{`
        @media (max-width: 820px) {
          div[style*="grid-template-columns: 1fr 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </form>
  );
}
