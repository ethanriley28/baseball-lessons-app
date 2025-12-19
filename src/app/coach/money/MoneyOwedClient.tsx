"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type UnpaidRow = {
  id: string;
  playerName: string;
  startISO: string;
  lessonType: string;
  durationMinutes: number;
  price: number;
};

export default function MoneyOwedClient({ rows }: { rows: UnpaidRow[] }) {
  const router = useRouter();
  const [methodById, setMethodById] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markPaid(bookingId: string) {
    const paymentMethod = (methodById[bookingId] ?? "Cash").trim();

    try {
      setLoadingId(bookingId);

      const res = await fetch("/api/bookings/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentMethod }),
      });

      if (!res.ok) {
        const txt = await res.text();
        alert(`Failed to mark paid: ${txt}`);
        return;
      }

      // ✅ refresh server totals + lists
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Network error marking paid.");
    } finally {
      setLoadingId(null);
    }
  }

  if (rows.length === 0) {
    return <div style={{ color: "#6b7280", fontSize: 13 }}>Nothing owed right now ✅</div>;
  }

  return (
    <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
      {rows.map((r) => {
        const loading = loadingId === r.id;

        return (
          <div
            key={r.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 10,
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
              background: "#fff",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: 900 }}>
                {r.playerName} ·{" "}
                {new Date(r.startISO).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                {r.lessonType} · {r.durationMinutes} min · <b>${r.price}</b>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={methodById[r.id] ?? "Cash"}
                onChange={(e) => setMethodById((p) => ({ ...p, [r.id]: e.target.value }))}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "8px 10px",
                  fontSize: 12,
                  fontWeight: 800,
                  background: "#fff",
                }}
              >
                <option value="Cash">Cash</option>
                <option value="Venmo">Venmo</option>
                <option value="Cash App">Cash App</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Other">Other</option>
              </select>

              <button
                type="button"
                onClick={() => markPaid(r.id)}
                disabled={loading}
                style={{
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #111827",
                  background: loading ? "#9ca3af" : "#111827",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Marking..." : "Mark Paid"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
