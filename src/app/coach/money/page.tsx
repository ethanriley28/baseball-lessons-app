import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MoneyOwedClient from "./MoneyOwedClient";

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfWeekExclusive(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() + 7);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonthExclusive(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function priceForBooking(durationMinutes: number | null | undefined) {
  const mins = durationMinutes ?? 60;
  return mins === 30 ? 30 : 60; // match your pricing
}

function weekKeyFromStart(weekStart: Date) {
  const y = weekStart.getFullYear();
  const m = String(weekStart.getMonth() + 1).padStart(2, "0");
  const d = String(weekStart.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

type PageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function CoachMoneyPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/coach/money");
  const role = (session.user as any).role as string | undefined;
  if (role !== "COACH") redirect("/dashboard");

  const now = new Date();

  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekExclusive(weekStart);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonthExclusive(now);

  // ✅ PAID this week
  const paidThisWeek = await prisma.booking.findMany({
    where: { paidAt: { gte: weekStart, lt: weekEnd } },
    select: { id: true, durationMinutes: true },
  });

  const weekEarnings = paidThisWeek.reduce(
    (sum, b) => sum + priceForBooking(b.durationMinutes),
    0
  );

  // ✅ PAID this month
  const paidThisMonth = await prisma.booking.findMany({
    where: { paidAt: { gte: monthStart, lt: monthEnd } },
    select: { id: true, durationMinutes: true },
  });

  const monthEarnings = paidThisMonth.reduce(
    (sum, b) => sum + priceForBooking(b.durationMinutes),
    0
  );

  // ✅ UNPAID but completed (money owed)
  const unpaidCompleted = await prisma.booking.findMany({
    where: {
      completedAt: { not: null },
      paidAt: null,
      status: "CONFIRMED",
    },
    include: { player: true },
    orderBy: { completedAt: "desc" },
    take: 30,
  });

  // ✅ Recent paid history
  const paidHistory = await prisma.booking.findMany({
    where: { paidAt: { not: null } },
    include: { player: true },
    orderBy: { paidAt: "desc" },
    take: 30,
  });

  // ✅ Range selector for breakdown: week | month | all
  const sp = await Promise.resolve(searchParams as any);
  const range = (typeof sp?.range === "string" ? sp.range : "week") as
    | "week"
    | "month"
    | "all";

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;

  if (range === "week") {
    const ws = startOfWeekMonday(now);
    rangeStart = ws;
    rangeEnd = endOfWeekExclusive(ws);
  } else if (range === "month") {
    rangeStart = startOfMonth(now);
    rangeEnd = endOfMonthExclusive(now);
  } else {
    rangeStart = null;
    rangeEnd = null;
  }

  // ✅ Payment Method Breakdown (for selected range)
  const paidForBreakdown = await prisma.booking.findMany({
    where:
      range === "all"
        ? { paidAt: { not: null } }
        : { paidAt: { gte: rangeStart!, lt: rangeEnd! } },
    select: {
      durationMinutes: true,
      paymentMethod: true,
    },
  });

  const methodBreakdown = paidForBreakdown.reduce((acc, b) => {
    const method = (b.paymentMethod ?? "Unknown").trim() || "Unknown";
    const total = priceForBooking(b.durationMinutes);

    acc[method] = acc[method] ?? { method, count: 0, total: 0 };
    acc[method].count += 1;
    acc[method].total += total;

    return acc;
  }, {} as Record<string, { method: string; count: number; total: number }>);

  const methodBreakdownList = Object.values(methodBreakdown).sort(
    (a, b) => b.total - a.total
  );

  // ✅ Client Leaderboard (for selected range)
  const paidForLeaderboard = await prisma.booking.findMany({
    where:
      range === "all"
        ? { paidAt: { not: null } }
        : { paidAt: { gte: rangeStart!, lt: rangeEnd! } },
    include: {
      player: { select: { name: true } },
      parent: { select: { name: true, email: true } },
    },
    orderBy: { paidAt: "desc" },
  });

  const clientMap = new Map<
    string,
    {
      key: string;
      clientName: string;
      email: string | null;
      sessions: number;
      total: number;
      lastPaidAt: Date | null;
      players: Set<string>;
    }
  >();

  for (const b of paidForLeaderboard) {
    const clientName = (b.parent as any)?.name ?? "Parent";
    const email = (b.parent as any)?.email ?? null;
    const key = (b.parentId ?? clientName) as string;

    const price = priceForBooking(b.durationMinutes);
    const row =
      clientMap.get(key) ??
      {
        key,
        clientName,
        email,
        sessions: 0,
        total: 0,
        lastPaidAt: null,
        players: new Set<string>(),
      };

    row.sessions += 1;
    row.total += price;

    const paidAt = (b as any).paidAt as Date | null | undefined;
    row.lastPaidAt = row.lastPaidAt
      ? new Date(Math.max(row.lastPaidAt.getTime(), (paidAt ?? new Date(0)).getTime()))
      : paidAt ?? null;

    if ((b.player as any)?.name) row.players.add((b.player as any).name);

    clientMap.set(key, row);
  }

  const clientLeaderboard = Array.from(clientMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // ✅ Trend data: last 8 weeks (paidAt)
  const weeksBack = 8;
  const earliestWeekStart = startOfWeekMonday(
    new Date(now.getTime() - (weeksBack - 1) * 7 * 24 * 60 * 60 * 1000)
  );
  const weeksRangeEnd = endOfWeekExclusive(weekStart);

  const paidForWeeks = await prisma.booking.findMany({
    where: { paidAt: { gte: earliestWeekStart, lt: weeksRangeEnd } },
    select: { paidAt: true, durationMinutes: true },
  });

  const weekTotals: Record<string, number> = {};
  for (let i = 0; i < weeksBack; i++) {
    const ws = new Date(earliestWeekStart);
    ws.setDate(ws.getDate() + i * 7);
    weekTotals[weekKeyFromStart(ws)] = 0;
  }

  for (const b of paidForWeeks) {
    if (!b.paidAt) continue;
    const ws = startOfWeekMonday(b.paidAt);
    const k = weekKeyFromStart(ws);
    weekTotals[k] = (weekTotals[k] ?? 0) + priceForBooking(b.durationMinutes);
  }

  const weeklyTrend = Object.entries(weekTotals).map(([k, total]) => ({
    weekStartKey: k,
    total,
  }));

  // ✅ Trend data: last 6 months (paidAt)
  const monthsBack = 6;
  const firstMonth = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1)
  );
  const monthsRangeEnd = endOfMonthExclusive(now);

  const paidForMonths = await prisma.booking.findMany({
    where: { paidAt: { gte: firstMonth, lt: monthsRangeEnd } },
    select: { paidAt: true, durationMinutes: true },
  });

  const monthTotals: Record<string, number> = {};
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1);
    monthTotals[monthKey(d)] = 0;
  }

  for (const b of paidForMonths) {
    if (!b.paidAt) continue;
    const mk = monthKey(b.paidAt);
    monthTotals[mk] = (monthTotals[mk] ?? 0) + priceForBooking(b.durationMinutes);
  }

  const monthlyTrend = Object.entries(monthTotals).map(([k, total]) => ({
    monthKey: k,
    total,
  }));

  // ✅ rows for client “Mark Paid” list
  const owedRows = unpaidCompleted.map((b) => ({
    id: b.id,
    playerName: b.player?.name ?? "Player",
    startISO: b.start.toISOString(),
    lessonType: b.lessonType ?? "Lesson",
    durationMinutes: b.durationMinutes ?? 60,
    price: priceForBooking(b.durationMinutes),
  }));

  return (
    <main style={{ padding: 24, background: "#f3f4f6", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "#111827" }}>
              Money Dashboard
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              Track paid sessions, unpaid completed sessions, and weekly/monthly totals.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href="/coach/calendar"
              style={{
                fontSize: 12,
                padding: "8px 12px",
                borderRadius: 9999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                textDecoration: "none",
                color: "#111827",
                fontWeight: 800,
              }}
            >
              ← Back to Calendar
            </Link>
          </div>
        </header>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 14,
          }}
        >
          <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>This Week</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>${weekEarnings}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Paid sessions: <b>{paidThisWeek.length}</b>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>This Month</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>${monthEarnings}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Paid sessions: <b>{paidThisMonth.length}</b>
            </div>
          </div>

          <div style={{ border: "1px solid #fee2e2", background: "#fff", borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 900 }}>Unpaid Completed</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, color: "#991b1b" }}>
              {unpaidCompleted.length}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Sessions completed but not paid yet.
            </div>
          </div>
        </div>

        {/* ✅ Trends */}
        <section
          style={{
            marginTop: 14,
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Trends</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Paid totals over time (based on paidAt).
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>Last 8 Weeks</div>
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                {weeklyTrend.map((w) => (
                  <div key={w.weekStartKey} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#6b7280", fontWeight: 800 }}>{w.weekStartKey}</span>
                    <span style={{ fontWeight: 900 }}>${w.total}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 900 }}>Last 6 Months</div>
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                {monthlyTrend.map((m) => (
                  <div key={m.monthKey} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#6b7280", fontWeight: 800 }}>{m.monthKey}</span>
                    <span style={{ fontWeight: 900 }}>${m.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ✅ Payment Method Breakdown */}
        <section
          style={{
            marginTop: 14,
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
                Payment Method Breakdown
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Range: <b>{range}</b>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/coach/money?range=week" style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                Week
              </Link>
              <span style={{ color: "#9ca3af" }}>·</span>
              <Link href="/coach/money?range=month" style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                Month
              </Link>
              <span style={{ color: "#9ca3af" }}>·</span>
              <Link href="/coach/money?range=all" style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                All
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {methodBreakdownList.map((m) => (
              <div
                key={m.method}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "10px 12px",
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>{m.method}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#111827", marginTop: 2 }}>
                  ${m.total}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  Sessions: <b>{m.count}</b>
                </div>
              </div>
            ))}

            {methodBreakdownList.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                No payments recorded in this range.
              </div>
            ) : null}
          </div>
        </section>

        {/* ✅ Money Owed (Mark Paid directly here) */}
        <section style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
            Money Owed (Completed + Unpaid)
          </div>
          <MoneyOwedClient rows={owedRows} />
        </section>

        {/* ✅ Client Leaderboard */}
        <section
          style={{
            marginTop: 14,
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>Client Leaderboard</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Top clients by paid revenue ({range === "week" ? "This Week" : range === "month" ? "This Month" : "All Time"}).
          </div>

          {clientLeaderboard.length === 0 ? (
            <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
              No paid sessions in this range yet.
            </div>
          ) : (
            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 12 }}>
                    <th style={{ padding: "10px 8px" }}>#</th>
                    <th style={{ padding: "10px 8px" }}>Client</th>
                    <th style={{ padding: "10px 8px" }}>Players</th>
                    <th style={{ padding: "10px 8px" }}>Paid Sessions</th>
                    <th style={{ padding: "10px 8px" }}>Total Paid</th>
                    <th style={{ padding: "10px 8px" }}>Last Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {clientLeaderboard.map((c, idx) => (
                    <tr key={c.key} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>{idx + 1}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ fontWeight: 900, color: "#111827" }}>{c.clientName}</div>
                        {c.email ? <div style={{ fontSize: 12, color: "#6b7280" }}>{c.email}</div> : null}
                      </td>
                      <td style={{ padding: "10px 8px", color: "#111827" }}>
                        {Array.from(c.players).slice(0, 3).join(", ")}
                        {c.players.size > 3 ? ` +${c.players.size - 3}` : ""}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>{c.sessions}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 900 }}>${c.total}</td>
                      <td style={{ padding: "10px 8px", color: "#6b7280" }}>
                        {c.lastPaidAt ? c.lastPaidAt.toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Paid history */}
        <section style={{ marginTop: 14, border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Recent Payments</div>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {paidHistory.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 13 }}>No payments yet.</div>
            ) : (
              paidHistory.map((b) => (
                <div
                  key={b.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>
                      {b.player?.name ?? "Player"} ·{" "}
                      {new Date(b.start).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                      Paid {b.paymentMethod ? `via ${b.paymentMethod}` : ""} ·{" "}
                      <b>${priceForBooking(b.durationMinutes)}</b>{" "}
                      {b.paidAt ? `· ${new Date(b.paidAt).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#16a34a" }}>PAID</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Mobile responsiveness */}
        <style>{`
          @media (max-width: 900px) {
            main div[style*="grid-template-columns: repeat(3, 1fr)"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </main>
  );
}
