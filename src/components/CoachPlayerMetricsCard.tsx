"use client";

import React, { useMemo, useState } from "react";

type MetricsSnapshot = {
  teeExitVelo: number | null;
  softTossExitVelo: number | null;
  sixtyTime: number | null;
  fiveTenFiveTime: number | null;
  homeToFirstTime: number | null;
  homeToSecondTime: number | null;
  updatedAtISO: string | null;
};

export default function CoachPlayerMetricsCard({
  playerId,
  playerName,
  parentName,
  metrics,
}: {
  playerId: string;
  playerName: string;
  parentName: string | null;
  metrics: MetricsSnapshot | null;
}) {
  const [saving, setSaving] = useState(false);

  // keep existing values as strings for inputs
  const [form, setForm] = useState({
    teeExitVelo: metrics?.teeExitVelo?.toString() ?? "",
    softTossExitVelo: metrics?.softTossExitVelo?.toString() ?? "",
    sixtyTime: metrics?.sixtyTime?.toString() ?? "",
    fiveTenFiveTime: metrics?.fiveTenFiveTime?.toString() ?? "",
    homeToFirstTime: metrics?.homeToFirstTime?.toString() ?? "",
    homeToSecondTime: metrics?.homeToSecondTime?.toString() ?? "",
    notes: "",
  });

  const updatedLabel = useMemo(() => {
    if (!metrics?.updatedAtISO) return "—";
    try {
      return new Date(metrics.updatedAtISO).toLocaleString();
    } catch {
      return "—";
    }
  }, [metrics?.updatedAtISO]);

  function inputBox(label: string, name: keyof typeof form, placeholder: string) {
    return (
      <div className="field">
        <div className="label">{label}</div>
        <input
          value={form[name]}
          onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
          placeholder={placeholder}
          className="input"
          inputMode="decimal"
        />
      </div>
    );
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/metrics/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          teeExitVelo: form.teeExitVelo,
          softTossExitVelo: form.softTossExitVelo,
          sixtyTime: form.sixtyTime,
          fiveTenFiveTime: form.fiveTenFiveTime,
          homeToFirstTime: form.homeToFirstTime,
          homeToSecondTime: form.homeToSecondTime,
          notes: form.notes,
        }),
      });

      if (!res.ok) {
        alert("Failed to save metrics.");
        return;
      }

      // simple refresh
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Network error saving metrics.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="card"
      style={{
        border: "1px solid #e5e7eb",
        background: "#fff",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div
        className="topRow"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
            {playerName}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Parent: <b>{parentName ?? "—"}</b> · Last updated: <b>{updatedLabel}</b>
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="saveBtn"
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #111827",
            background: saving ? "#9ca3af" : "#111827",
            color: "#fff",
            fontWeight: 900,
            cursor: saving ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Saving..." : "Save Metrics"}
        </button>
      </div>

      <div
        className="grid"
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {inputBox("Tee Exit Velo", "teeExitVelo", "ex: 82.5")}
        {inputBox("Soft Toss Exit Velo", "softTossExitVelo", "ex: 79.0")}
        {inputBox("60 Time", "sixtyTime", "ex: 7.12")}
        {inputBox("5-10-5", "fiveTenFiveTime", "ex: 4.45")}
        {inputBox("Home to 1st", "homeToFirstTime", "ex: 4.25")}
        {inputBox("Home to 2nd", "homeToSecondTime", "ex: 8.60")}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#111827", marginBottom: 6 }}>
          Notes (optional)
        </div>
        <textarea
          className="textarea"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="ex: PR in tee velo, better first step, etc."
          style={{
            width: "100%",
            minHeight: 84,
            border: "1px solid #d1d5db",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* MOBILE ONLY OVERRIDES — desktop unchanged */}
      <style jsx>{`
        .label {
          font-size: 12px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 6px;
        }
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          background: #fff;
        }

        @media (max-width: 820px) {
          .card {
            padding: 12px !important;
          }

          .topRow {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .saveBtn {
            width: 100% !important;
          }

          .grid {
            grid-template-columns: 1fr !important;
          }

          .input,
          .textarea {
            font-size: 16px !important; /* mobile zoom fix */
          }
        }
      `}</style>
    </section>
  );
}
