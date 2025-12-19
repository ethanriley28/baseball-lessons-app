"use client";

import React from "react";

type PlayerReportSession = {
  date?: string;
  lessonType?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
};

type PlayerReportData = {
  playerName: string;
  parentName?: string | null;
  avatarUrl?: string | null;

  // 🔧 FIX: sessions is optional
  sessions?: PlayerReportSession[];
};

function buildSessionsHtml(sessions: PlayerReportSession[]) {
  if (!sessions.length) {
    return `<p>No sessions recorded yet.</p>`;
  }

  return `
    <ul>
      ${sessions
        .map(
          (s) => `
        <li>
          <b>${s.lessonType ?? "Lesson"}</b> —
          ${s.durationMinutes ?? "?"} min
          ${s.notes ? `<br/>${s.notes}` : ""}
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

function buildAvatarHtml(report: PlayerReportData) {
  if (!report.avatarUrl) return "";

  return `
    <img
      src="${report.avatarUrl}"
      alt="${report.playerName}"
      style="width:72px;height:72px;border-radius:16px;object-fit:cover;"
    />
  `;
}

export default function PlayerProfilePageButton({
  report,
}: {
  report: PlayerReportData;
}) {
  function onClick() {
    const sessionsHtml = buildSessionsHtml(report.sessions ?? []);
    const avatarHtml = buildAvatarHtml(report);

    const html = `
      <html>
        <body style="font-family:system-ui;padding:20px;">
          ${avatarHtml}
          <h2>${report.playerName}</h2>
          ${
            report.parentName
              ? `<p>Parent: ${report.parentName}</p>`
              : ""
          }
          <h3>Sessions</h3>
          ${sessionsHtml}
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#fff",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      View Player Report
    </button>
  );
}
