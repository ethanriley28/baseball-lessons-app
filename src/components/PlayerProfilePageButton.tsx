"use client";

import React from "react";
import type { PlayerReportData } from "./PlayerReportButton";

type Props = {
  report: PlayerReportData;
};

export default function PlayerProfilePageButton({ report }: Props) {
  const handleClick = () => {
    if (typeof window === "undefined") return;

    const win = window.open("", "_blank");
    if (!win) return;

    const generatedAt = new Date().toLocaleString();

    const formatMetric = (value?: number | null, unit?: string) => {
      if (value == null) return "-";
      return `${value} ${unit ?? ""}`.trim();
    };

    const sessionsHtml = buildSessionsHtml(report.sessions);
    const avatarHtml = buildAvatarHtml(report);

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${report.name} - Player Profile</title>
    <style>
      * {
        box-sizing: border-box;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        padding: 24px;
        background: #0f172a;
        color: #e5e7eb;
      }
      .page {
        max-width: 960px;
        margin: 0 auto;
        background: #020617;
        padding: 24px 28px 32px;
        border-radius: 16px;
        box-shadow: 0 18px 45px rgba(0,0,0,0.45);
        border: 1px solid #1e293b;
      }
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 18px;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .avatar {
        width: 52px;
        height: 52px;
        border-radius: 9999px;
        overflow: hidden;
        background: #1f2937;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 700;
        color: #9ca3af;
        flex-shrink: 0;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      h1 {
        font-size: 26px;
        margin: 0 0 4px;
        color: #f9fafb;
      }
      h2 {
        font-size: 16px;
        margin: 16px 0 8px;
        color: #e5e7eb;
      }
      h3 {
        font-size: 13px;
        margin: 8px 0 4px;
        color: #e5e7eb;
      }
      .subtext {
        font-size: 12px;
        color: #9ca3af;
      }
      .section-row {
        display: grid;
        grid-template-columns: minmax(0, 2.1fr) minmax(0, 1.4fr);
        gap: 16px;
        margin-top: 10px;
      }
      .section-card {
        background: #020617;
        border-radius: 12px;
        border: 1px solid #1f2937;
        padding: 12px 14px;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px 16px;
        font-size: 12px;
      }
      .metric-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #9ca3af;
      }
      .metric-value {
        font-weight: 600;
        color: #f9fafb;
        font-size: 14px;
      }
      .sessions-list {
        max-height: 220px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .session-block {
        border-bottom: 1px solid #1f2937;
        padding-bottom: 6px;
        margin-bottom: 6px;
      }
      .session-date {
        font-size: 12px;
        font-weight: 600;
        color: #e5e7eb;
      }
      .session-metric {
        font-size: 11px;
      }
      .pr {
        color: #22c55e;
        font-weight: 700;
        margin-left: 4px;
      }
      .improve {
        color: #22c55e;
        margin-left: 6px;
      }
      .worse {
        color: #f97373;
        margin-left: 6px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        margin-top: 4px;
      }
      .table th,
      .table td {
        border: 1px solid #1f2937;
        padding: 4px 6px;
        text-align: left;
      }
      .table th {
        background: #020617;
        font-weight: 600;
        color: #e5e7eb;
      }
      .table tr:nth-child(even) td {
        background: #020617;
      }
      .table tr:nth-child(odd) td {
        background: #020617;
      }
      .notes {
        white-space: pre-wrap;
      }
      .footer {
        margin-top: 16px;
        font-size: 10px;
        color: #6b7280;
        text-align: right;
      }
      @media print {
        body {
          background: #ffffff;
          color: #111827;
        }
        .page {
          box-shadow: none;
          border-radius: 0;
          border-color: #e5e7eb;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header-row">
        <div class="header-left">
          <div class="avatar">
            ${avatarHtml}
          </div>
          <div>
            <h1>${report.name}</h1>
            <div class="subtext">
              Player Profile · Ethan Riley Training${
                report.parentName ? ` · Parent: ${report.parentName}` : ""
              }
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <div class="subtext">Generated: ${generatedAt}</div>
          <div class="subtext">Shareable · Printable · Coach View Ready</div>
        </div>
      </div>

      <div class="section-row">
        <!-- LEFT: metrics & progress -->
        <div class="section-card">
          <h2>Current Metrics Snapshot</h2>
          <div class="metrics-grid">
            <div>
              <div class="metric-label">Tee Exit Velocity</div>
              <div class="metric-value">${formatMetric(
                report.currentMetrics.teeExitVelo,
                "mph"
              )}</div>
            </div>
            <div>
              <div class="metric-label">Soft Toss Exit Velocity</div>
              <div class="metric-value">${formatMetric(
                report.currentMetrics.softTossExitVelo,
                "mph"
              )}</div>
            </div>
            <div>
              <div class="metric-label">60 Yard Time</div>
              <div class="metric-value">${formatMetric(
                report.currentMetrics.sixtyTime,
                "sec"
              )}</div>
            </div>
            <div>
              <div class="metric-label">5–10–5 Shuttle</div>
              <div class="metric-value">${formatMetric(
                report.currentMetrics.fiveTenFiveTime,
                "sec"
              )}</div>
            </div>
            <div>
              <div class="metric-label">Home–1st</div>
              <div class="metric-value">${formatMetric(
                report.currentMetrics.homeToFirstTime,
                "sec"
              )}</div>
            </div>
            <div>
              <div class="metric-label">Home–2nd</div>
              <div class="metric-value">${formatMetric(
                report.currentMetrics.homeToSecondTime,
                "sec"
              )}</div>
            </div>
          </div>

          <h3 style="margin-top: 14px;">Recent Metric Sessions</h3>
          ${
            report.sessions.length === 0
              ? `<div class="subtext">No logged metric sessions yet.</div>`
              : `<div class="sessions-list">${sessionsHtml}</div>`
          }
        </div>

        <!-- RIGHT: lesson history -->
        <div class="section-card">
          <h2>Lesson History & Notes</h2>
          ${
            report.lessons.length === 0
              ? `<div class="subtext">No lessons recorded yet.</div>`
              : `
          <table class="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Dur</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${report.lessons
                .map((l) => {
                  const d = new Date(l.dateTime).toLocaleString();
                  const notesSafe = (l.notes ?? "")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                  return `
                    <tr>
                      <td>${d}</td>
                      <td>${l.lessonType}</td>
                      <td>${l.durationMinutes}m</td>
                      <td class="notes">${notesSafe}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
          `
          }
        </div>
      </div>

      <div class="footer">
        Tip: Use your browser's <strong>Print</strong> to save or share this profile as a PDF.
      </div>
    </div>
  </body>
</html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        fontSize: 11,
        padding: "4px 8px",
        borderRadius: 9999,
        border: "1px solid #1f2937",
        background: "#020617",
        color: "#e5e7eb",
        cursor: "pointer",
        marginTop: 6,
        marginRight: 6,
      }}
    >
      View Full Profile
    </button>
  );
}

function buildAvatarHtml(report: PlayerReportData): string {
  const initial =
    (report.name && report.name.trim().charAt(0).toUpperCase()) || "P";

  if (report.photoUrl) {
    const safeUrl = report.photoUrl.replace(/"/g, "&quot;");
    const alt = (report.name || "Player photo").replace(/"/g, "&quot;");
    return `<img src="${safeUrl}" alt="${alt}" />`;
  }

  return initial;
}

function buildSessionsHtml(
  sessions: PlayerReportData["sessions"]
): string {
  if (!sessions.length) return "";

  const keys = [
    { key: "teeExitVelo", label: "Tee EV", unit: "mph", higher: true },
    { key: "softTossExitVelo", label: "Soft Toss EV", unit: "mph", higher: true },
    { key: "sixtyTime", label: "60 Time", unit: "sec", higher: false },
    { key: "fiveTenFiveTime", label: "5-10-5", unit: "sec", higher: false },
    { key: "homeToFirstTime", label: "Home–1st", unit: "sec", higher: false },
    { key: "homeToSecondTime", label: "Home–2nd", unit: "sec", higher: false },
  ] as const;

  const bestMap: Record<string, number> = {};

  for (const { key, higher } of keys) {
    let best: number | null = null;
    for (const s of sessions as any[]) {
      const v = s[key];
      if (v == null) continue;
      if (best == null) best = v;
      else if (higher ? v > best : v < best) best = v;
    }
    if (best != null) bestMap[key] = best;
  }

  const blocks: string[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i] as any;
    const prev = i + 1 < sessions.length ? (sessions[i + 1] as any) : null;
    const date = new Date(s.date).toLocaleDateString();

    const lines: string[] = [];

    for (const { key, label, unit, higher } of keys) {
      const v = s[key];
      if (v == null) continue;

      const best = bestMap[key];
      const isPR = best != null && v === best;

      let diffText = "";
      let diffClass = "";

      if (prev && prev[key] != null) {
        const diff = v - prev[key];
        if (Math.abs(diff) > 0.01) {
          const rounded = Math.round(diff * 10) / 10;
          const improved = higher ? diff > 0 : diff < 0;

          diffText = `(${diff > 0 ? "+" : ""}${rounded} ${unit} from last)`;
          diffClass = improved ? "improve" : "worse";
        }
      }

      lines.push(`
        <div class="session-metric">
          <strong>${label}:</strong> ${v} ${unit}
          ${isPR ? '<span class="pr">PR</span>' : ""}
          ${diffText ? `<span class="${diffClass}">${diffText}</span>` : ""}
        </div>
      `);
    }

    blocks.push(`
      <div class="session-block">
        <div class="session-date">${date}</div>
        ${lines.length ? lines.join("") : `<div class="subtext">No metrics logged in this session.</div>`}
      </div>
    `);
  }

  return blocks.join("");
}
