"use client";

import { useState } from "react";

export default function BookingNotesEditor(props: {
  bookingId: string;
  initialNotes?: string | null;
  onSaved?: () => void;
}) {
  const [notes, setNotes] = useState(props.initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setErr(null);

    try {
      const res = await fetch(`/api/bookings/${props.bookingId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to save notes");
      }

      setSaved(true);
      props.onSaved?.();
      setTimeout(() => setSaved(false), 1200);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "#fff",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <div style={{ fontWeight: 900, color: "#111827" }}>Session Notes</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>One line = one bullet</div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={"Example:\n- Focused on staying through the ball\n- Front toss: middle-away\n- Finished with 2-strike approach"}
        rows={6}
        style={{
          width: "100%",
          marginTop: 10,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 10,
          fontSize: 13,
          outline: "none",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10 }}>
        <div style={{ fontSize: 12 }}>
          {err ? <span style={{ color: "#b91c1c", fontWeight: 800 }}>{err}</span> : null}
          {saved ? <span style={{ color: "#16a34a", fontWeight: 900 }}>Saved ✓</span> : null}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #111827",
            background: saving ? "#6b7280" : "#111827",
            color: "#fff",
            fontWeight: 900,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
