import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CoachCalendarClient } from "@/components/CoachCalendarClient";

function parseMonthParam(month?: string | null) {
  // Accepts "YYYY-MM" (ex: "2025-12")
  if (!month) return new Date();

  const m = month.trim();
  const match = m.match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date();

  const year = Number(match[1]);
  const mon = Number(match[2]); // 1-12
  if (!Number.isFinite(year) || !Number.isFinite(mon) || mon < 1 || mon > 12) {
    return new Date();
  }

  return new Date(year, mon - 1, 1);
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // move to Monday
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfWeekExclusive(weekStart: Date) {
  const x = new Date(weekStart);
  x.setDate(x.getDate() + 7);
  return x; // exclusive end
}

function priceForBooking(durationMinutes: number | null | undefined) {
  // Match your pricing (edit if needed)
  const mins = durationMinutes ?? 60;
  return mins === 30 ? 30 : 60;
}

type PageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function CoachCalendarPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login?callbackUrl=/coach/calendar");
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "COACH") {
    redirect("/dashboard");
  }

  const sp = await Promise.resolve(searchParams as any);
  const monthRaw = typeof sp?.month === "string" ? sp.month : undefined;

  const monthAnchor = parseMonthParam(monthRaw);

  const monthStart = new Date(
    monthAnchor.getFullYear(),
    monthAnchor.getMonth(),
    1
  );
  const monthEnd = new Date(
    monthAnchor.getFullYear(),
    monthAnchor.getMonth() + 1,
    1
  );

  // ✅ Stable “now” snapshot
  const now = new Date();
  const nowISO = now.toISOString();

  // ✅ Weekly window (Mon -> next Mon)
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekExclusive(weekStart);

  // ✅ Auto-mark completed lessons (end time passed)
  await prisma.booking.updateMany({
    where: {
      status: "CONFIRMED",
      completedAt: null,
      end: { lt: now },
    },
    data: { completedAt: now },
  });

  // ✅ Paid sessions this week (earnings)
  const weekPaid = await prisma.booking.findMany({
    where: { paidAt: { gte: weekStart, lt: weekEnd } },
    select: { durationMinutes: true },
  });

  const weekPaidCount = weekPaid.length;
  const weekEarnings = weekPaid.reduce(
    (sum, b) => sum + priceForBooking(b.durationMinutes),
    0
  );

  // ✅ Completed but unpaid this week
  const weekCompletedUnpaid = await prisma.booking.count({
    where: {
      completedAt: { gte: weekStart, lt: weekEnd },
      paidAt: null,
    },
  });

  // Pull bookings for the visible month
  const bookings = await prisma.booking.findMany({
    where: { start: { gte: monthStart, lt: monthEnd } },
    include: { player: true },
    orderBy: { start: "asc" },
  });

  // Availability blocks that overlap this month
  const availabilityBlocks = await prisma.availabilityBlock.findMany({
    where: {
      start: { lt: monthEnd },
      end: { gt: monthStart },
    },
    orderBy: { start: "asc" },
  });

  const calendarAvailability = availabilityBlocks.map((a) => ({
    id: a.id,
    start: a.start.toISOString(),
    end: a.end.toISOString(),
  }));

  const calendarBookings = bookings.map((b) => ({
    id: b.id,
    start: b.start.toISOString(),
    durationMinutes: b.durationMinutes,
    lessonType: b.lessonType,
    playerName: b.player?.name ?? "Player",
    createdAtISO: b.createdAt.toISOString(),
    completedAtISO: b.completedAt ? b.completedAt.toISOString() : null,
    paidAtISO: b.paidAt ? b.paidAt.toISOString() : null,
    paymentMethod: b.paymentMethod ?? null,
  }));

  return (
    <main style={{ padding: 24, background: "#f3f4f6", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-0.02em",
                color: "#111827",
              }}
            >
              Coach Calendar
            </h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Month view of all scheduled lessons. Drag a lesson to another day
              to reschedule it.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Weekly earnings card */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                background: "#fff",
                borderRadius: 14,
                padding: "10px 12px",
                minWidth: 240,
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
                This Week (Mon–Sun)
              </div>

              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2, color: "#111827" }}>
                ${weekEarnings}
              </div>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                Paid sessions: <b>{weekPaidCount}</b>
                {weekCompletedUnpaid > 0 ? (
                  <>
                    {" "}· Unpaid completed: <b>{weekCompletedUnpaid}</b>
                  </>
                ) : null}
              </div>
            </div>

  <Link
    href="/coach"
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
    ← Back to Coach View
  </Link>

  <Link
    href="/coach/money"
    style={{
      fontSize: 12,
      padding: "8px 12px",
      borderRadius: 9999,
      border: "1px solid #e5e7eb",
      background: "#fff7ed",
      textDecoration: "none",
      color: "#9a3412",
      fontWeight: 900,
    }}
  >
    💰 Money Dashboard
  </Link>
</div>

        </header>

        <CoachCalendarClient
          monthISO={monthAnchor.toISOString()}
          bookings={calendarBookings}
          availability={calendarAvailability}
          nowISO={nowISO}
        />
      </div>
    </main>
  );
}
