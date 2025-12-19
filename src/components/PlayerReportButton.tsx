"use client";

import React from "react";
import { jsPDF } from "jspdf";

export type PlayerReportData = {
  name: string;
  parentName?: string | null;

  // Bio / header info
  school?: string | null;
  classLabel?: string | null; // e.g. "Junior", "Senior"
  gradYear?: number | null;
  position?: string | null;
  bats?: string | null;
  throws?: string | null;
  height?: string | null;
  weight?: number | null;
  travelOrg?: string | null;

  // Metrics
  currentMetrics?: {
    teeExitVelo?: number | null;
    softTossExitVelo?: number | null;
    sixtyTime?: number | null;
    fiveTenFiveTime?: number | null;
    homeToFirstTime?: number | null;
    homeToSecondTime?: number | null;
  } | null;

  // Recent sessions / history
  recentSessions?: {
    date: string; // already formatted for display (e.g. "12/09/2025")
    teeExitVelo?: number | null;
    softTossExitVelo?: number | null;
    sixtyTime?: number | null;
    fiveTenFiveTime?: number | null;
    homeToFirstTime?: number | null;
    homeToSecondTime?: number | null;
  }[] | null;
};

type Props = {
  data: PlayerReportData;
};

export function PlayerReportButton({ data }: Props) {
  const handleClick = () => {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    const marginLeft = 48;
    let y = 64;

    // TITLE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Player Performance Report", marginLeft, y);
    y += 26;

    // Name + org line
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(data.name || "Unnamed Player", marginLeft, y);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (data.parentName) {
      doc.text(`Parent: ${data.parentName}`, marginLeft + 260, y);
    }
    y += 20;

    // BIO / HEADER BLOCK
    const bioLines: string[] = [];

    // Build the same style summary you see on the web header
    const bioParts: string[] = [];
    if (data.school) bioParts.push(data.school);
    if (data.classLabel) bioParts.push(data.classLabel);
    if (data.gradYear != null) bioParts.push(`Class of ${data.gradYear}`);
    if (data.position) bioParts.push(data.position);
    if (data.bats) bioParts.push(`Bats: ${data.bats}`);
    if (data.throws) bioParts.push(`Throws: ${data.throws}`);
    if (data.height) bioParts.push(data.height);
    if (data.weight != null) bioParts.push(`${data.weight} lbs`);
    if (data.travelOrg) bioParts.push(data.travelOrg);

    if (bioParts.length > 0) {
      bioLines.push(bioParts.join(" · "));
    }

    if (bioLines.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      bioLines.forEach((line) => {
        doc.text(line, marginLeft, y);
        y += 16;
      });
    } else {
      y += 8;
    }

    y += 10;

    // SECTION: CURRENT METRICS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Current Metrics", marginLeft, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const m = data.currentMetrics || {};

    const metricLines: string[] = [];
    if (m.teeExitVelo != null) metricLines.push(`Tee EV: ${m.teeExitVelo} mph`);
    if (m.softTossExitVelo != null)
      metricLines.push(`Soft Toss EV: ${m.softTossExitVelo} mph`);
    if (m.sixtyTime != null) metricLines.push(`60 Time: ${m.sixtyTime} s`);
    if (m.fiveTenFiveTime != null)
      metricLines.push(`5-10-5: ${m.fiveTenFiveTime} s`);
    if (m.homeToFirstTime != null)
      metricLines.push(`Home–1st: ${m.homeToFirstTime} s`);
    if (m.homeToSecondTime != null)
      metricLines.push(`Home–2nd: ${m.homeToSecondTime} s`);

    if (metricLines.length === 0) {
      doc.text("No current metrics recorded.", marginLeft, y);
      y += 18;
    } else {
      metricLines.forEach((line) => {
        doc.text(`• ${line}`, marginLeft, y);
        y += 16;
      });
    }

    y += 18;

    // SECTION: RECENT SESSIONS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Recent Sessions", marginLeft, y);
    y += 18;

    const sessions = data.recentSessions || [];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    if (sessions.length === 0) {
      doc.text("No recent session history.", marginLeft, y);
      y += 18;
    } else {
      sessions.slice(0, 8).forEach((session) => {
        if (y > 760) {
          doc.addPage();
          y = 64;
        }

        doc.setFont("helvetica", "bold");
        doc.text(session.date, marginLeft, y);
        y += 14;

        doc.setFont("helvetica", "normal");

        const sessionLines: string[] = [];
        if (session.teeExitVelo != null)
          sessionLines.push(`Tee EV: ${session.teeExitVelo} mph`);
        if (session.softTossExitVelo != null)
          sessionLines.push(`Soft Toss EV: ${session.softTossExitVelo} mph`);
        if (session.sixtyTime != null)
          sessionLines.push(`60 Time: ${session.sixtyTime} s`);
        if (session.fiveTenFiveTime != null)
          sessionLines.push(`5-10-5: ${session.fiveTenFiveTime} s`);
        if (session.homeToFirstTime != null)
          sessionLines.push(`Home–1st: ${session.homeToFirstTime} s`);
        if (session.homeToSecondTime != null)
          sessionLines.push(`Home–2nd: ${session.homeToSecondTime} s`);

        if (sessionLines.length === 0) {
          doc.text("No metrics recorded for this session.", marginLeft, y);
          y += 18;
        } else {
          sessionLines.forEach((line) => {
            doc.text(`• ${line}`, marginLeft, y);
            y += 14;
          });
          y += 6;
        }
      });
    }

    y += 18;

    // FOOTER
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(
      "Generated via Ethan Riley Training – Player Development Report",
      marginLeft,
      820
    );

    doc.save(`${data.name || "player"}-report.pdf`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 9999,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      📄 Export Player Report
    </button>
  );
}
