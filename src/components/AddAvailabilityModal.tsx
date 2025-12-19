"use client";

import React, { useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function to12hLabel(h24: number, m: number) {
  const ampm = h24 >= 12 ? "PM" : "AM";
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${pad2(m)} ${ampm}`;
}

function toISOTimeValue(h24: number, m: number) {
  // Store as "HH:MM" (24h) internally, but UI shows 12h labels
  return `${pad2(h24)}:${pad2(m)}`;
}

function buildTimeOptions(stepMinutes = 30) {
  const opts: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      opts.push({
        value: toISOTimeValue(h, m),
        label: to12hLabel(h, m),
      });
    }
  }
  return opts;
}

export default function AddAvailabilityModal(props: {
  open: boolean;
  dateLabel: string;
  onClose: () => void;
  onSave: (startTime24: string, endTime24: string) => void;
}) {
  const options = useMemo(() => buildTimeOptions(30), []);
  const [start, setStart] = useState("14:00"); // 2:00 PM
  const [end, setEnd] = useState("16:00"); // 4:00 PM
  const [error, setError] = useState<string | null>(null);

  if (!props.open) return null;

  function isEndAfterStart(s: string, e: string) {
    const [sh, sm] = s.split(":").map(Number);
    const [eh, em] = e.split(":").map(Number);
    return eh * 60 + em > sh * 60 + sm;
  }

  function handleSave() {
    setError(null);

    if (!isEndAfterStart(start, end)) {
      setError("End time must be after start time.");
      return;
    }

    props.onSave(start, end);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 9999,
      }}
      onMouseDown={props.onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 24px 60px rgba(15,23,42,0.35)",
          padding: 16,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
              Add availability
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>
              {props.dateLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={props.onClose}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              borderRadius: 12,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800, marginBottom: 6 }}>
              Start
            </div>
            <select
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontWeight: 800,
              }}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800, marginBottom: 6 }}>
              End
            </div>
            <select
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontWeight: 800,
              }}
            >
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <div
              style={{
                fontSize: 12,
                color: "#b91c1c",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "8px 10px",
                fontWeight: 800,
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
          <button
            type="button"
            onClick={props.onClose}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 14px 26px rgba(37,99,235,0.18)",
            }}
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
}
