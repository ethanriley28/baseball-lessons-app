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

type MetricsHistoryRow = {
  createdAt: string | Date;
  teeExitVelo: number | null;
  softTossExitVelo: number | null;
  sixtyTime: number | null;
  fiveTenFiveTime: number | null;
  homeToFirstTime: number | null;
  homeToSecondTime: number | null;
};

function fmtDelta(val: number) {
  const sign = val > 0 ? "+" : "";
  return `${sign}${val}`;
}

function isLowerBetter(field: keyof MetricsSnapshot) {
  return (
    field === "sixtyTime" ||
    field === "fiveTenFiveTime" ||
    field === "homeToFirstTime" ||
    field === "homeToSecondTime"
  );
}

function toNum(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export default function CoachPlayerMetricsCard({
  playerId,
  playerName,
  parentName,
  metrics,
  metricsHistory = [],
}: {
  playerId: string;
  playerName: string;
  parentName: string | null;
  metrics: MetricsSnapshot | null;
  metricsHistory?: MetricsHistoryRow[];
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

  // --- PR + Trend helpers (low effort, high wow)
  const trend = useMemo(() => {
    // newest first
    const rows = [...(metricsHistory ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const fields: (keyof MetricsSnapshot)[] = [
      "teeExitVelo",
      "softTossExitVelo",
      "sixtyTime",
      "fiveTenFiveTime",
      "homeToFirstTime",
      "homeToSecondTime",
    ];

    const result: Record<
      string,
      { isPR: boolean; deltaVsLast: number | null; betterArrow: "up" | "down" | null }
    > = {};

    for (const f of fields) {
      const values = rows
        .map((r) => toNum((r as any)[f]))
        .filter((v) => v !== null) as number[];

      const current = toNum((metrics as any)?.[f]);
      const last = values.length > 1 ? values[1] : null; // previous session
      const best =
        values.length === 0
          ? null
          : isLowerBetter(f)
          ? Math.min(...values)
          : Math.max(...values);

      const isPR =
        current !== null && best !== null
          ? isLowerBetter(f)
            ? current <= best
            : current >= best
          : false;

      let deltaVsLast: number | null = null;
      if (current !== null && last !== null) deltaVsLast = current - last;

      // "betterArrow" indicates performance direction (not math sign):
      // - for velo, higher is better => up arrow means improved
      // - for times, lower is better => down arrow means improved
      let betterArrow: "up" | "down" | null = null;
      if (deltaVsLast !== null && deltaVsLast !== 0) {
        if (isLowerBetter(f)) {
          // improved if negative delta
          betterArrow = deltaVsLast < 0 ? "down" : "up";
        } else {
          // improved if positive delta
          betterArrow = deltaVsLast > 0 ? "up" : "down";
        }
      }

      result[f] = { isPR, deltaVsLast, betterArrow };
    }

    return result;
  }, [metricsHistory, metrics]);

  function inputBox(label: string, name: keyof typeof form, placeholder: string) {
    const keyMap: Record<string, keyof MetricsSnapshot> = {
      teeExitVelo: "teeExitVelo",
      softTossExitVelo: "softTossExitVelo",
      sixtyTime: "sixtyTime",
      fiveTenFiveTime: "fiveTenFiveTime",
      homeToFirstTime: "homeToFirstTime",
      homeToSecondTime: "homeToSecondTime",
    };

    const k = keyMap[name as string];
    const t = k ? trend[k] : null;

    const showPR = !!t?.isPR;
    const hasDelta = t?.deltaVsLast !== null && t?.deltaVsLast !== undefined;

    // For times, we want to display delta as "-0.12s" etc.
    // For velo, "+2 mph" etc. We'll keep raw delta and just show sign.
    const unit = k && (k === "teeExitVelo" || k === "softTossExitVelo") ? " mph" : " s";

    return (
      <div className="field">
        <div className="labelRow">
          <div className="label">{label}</div>

          <div className="badges">
            {showPR ? <span className="pr">PR</span> : null}

            {hasDelta ? (
              <span className={`delta ${t?.betterArrow === "up" ? "up" : t?.betterArrow === "down" ? "down" : ""}`}>
                {t?.betterArrow === "up" ? "▲" : t?.betterArrow === "down" ? "▼" : ""}
                {fmtDelta(Number((t?.deltaVsLast ?? 0).toFixed(2)))}{unit}
              </span>
            ) : null}
          </div>
        </div>

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
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{playerName}</div>
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

      <style jsx>{`
        .labelRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .label {
          font-size: 12px;
          font-weight: 800;
          color: #111827;
        }
        .badges {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pr {
          font-size: 11px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 9999px;
          background: #111827;
          color: #fff;
        }
        .delta {
          font-size: 11px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 9999px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #111827;
          white-space: nowrap;
        }
        .delta.up {
          border-color: rgba(34, 197, 94, 0.35);
        }
        .delta.down {
          border-color: rgba(239, 68, 68, 0.35);
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
