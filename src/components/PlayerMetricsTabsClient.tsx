"use client";

import React, { useMemo, useState } from "react";

type TabKey = "profile" | "metrics" | "sessions" | "bookings" | "account";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: active ? "#111827" : "#fff",
        color: active ? "#fff" : "#111827",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#fff",
        padding: 16,
        boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function PlayerMetricsTabsClient(props: {
  currentMetrics: any | null;
  metricsHistory: any[];
  bookings: any[];
  parentName?: string | null;
  parentEmail?: string | null;
}) {
  const [tab, setTab] = useState<TabKey>("profile");

  const sortedBookings = useMemo(() => {
    const arr = Array.isArray(props.bookings) ? props.bookings : [];
    return [...arr].sort((a, b) => {
      const as = new Date(a.start ?? a.date ?? 0).getTime();
      const bs = new Date(b.start ?? b.date ?? 0).getTime();
      return as - bs;
    });
  }, [props.bookings]);

  const sortedSessions = useMemo(() => {
    const arr = Array.isArray(props.metricsHistory) ? props.metricsHistory : [];
    return [...arr].sort((a, b) => {
      const ad = new Date(a.createdAt ?? a.date ?? 0).getTime();
      const bd = new Date(b.createdAt ?? b.date ?? 0).getTime();
      return bd - ad;
    });
  }, [props.metricsHistory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
          Profile
        </TabButton>
        <TabButton active={tab === "metrics"} onClick={() => setTab("metrics")}>
          Metrics
        </TabButton>
        <TabButton
          active={tab === "sessions"}
          onClick={() => setTab("sessions")}
        >
          Sessions
        </TabButton>
        <TabButton
          active={tab === "bookings"}
          onClick={() => setTab("bookings")}
        >
          Bookings
        </TabButton>
        <TabButton active={tab === "account"} onClick={() => setTab("account")}>
          Account
        </TabButton>
      </div>

      {/* Content */}
      {tab === "profile" && (
        <Card title="Player Profile">
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            This tab is for the player bio + school/grad year + quick info.
          </p>
          <div style={{ height: 10 }} />
          <p style={{ margin: 0, fontSize: 13 }}>
            Use the “Player Info” form above to edit details.
          </p>
        </Card>
      )}

      {tab === "metrics" && (
        <Card title="Current Metrics">
          {!props.currentMetrics ? (
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
              No current metrics recorded yet.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              {Object.entries(props.currentMetrics).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    background: "#f9fafb",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>
                    {k}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                    {v == null || v === "" ? "-" : String(v)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "sessions" && (
        <Card title="Recent Sessions">
          {sortedSessions.length === 0 ? (
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
              No session history recorded yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedSessions.slice(0, 10).map((s, idx) => (
                <div
                  key={s.id ?? idx}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13 }}>
                    {new Date(s.createdAt ?? s.date ?? Date.now()).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {s.notes ? `Notes: ${s.notes}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "bookings" && (
        <Card title="Bookings">
          {sortedBookings.length === 0 ? (
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
              No bookings yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedBookings.slice(0, 15).map((b, idx) => (
                <div
                  key={b.id ?? idx}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13 }}>
                    {new Date(b.start ?? b.date ?? Date.now()).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {b.lessonType ? `Type: ${b.lessonType}` : "Lesson"}
                    {b.durationMinutes ? ` · ${b.durationMinutes} min` : ""}
                  </div>
                  {b.notes ? (
                    <div style={{ marginTop: 6, fontSize: 12 }}>{b.notes}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "account" && (
        <Card title="Account">
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            Parent contact info (read-only):
          </p>
          <div style={{ height: 10 }} />
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Name:</b> {props.parentName ?? "-"}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            <b>Email:</b> {props.parentEmail ?? "-"}
          </p>
        </Card>
      )}
    </div>
  );
}
