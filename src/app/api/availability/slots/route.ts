import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toDayRange(dateStr: string) {
  // dateStr = "2025-12-29"
  // Use local day boundaries on server; we’ll treat stored times consistently (ISO)
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    const durationStr = searchParams.get("duration") ?? "60";
    const durationMinutes = Math.max(30, parseInt(durationStr, 10) || 60);

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const { start: dayStart, end: dayEnd } = toDayRange(date);

    // 1) get availability blocks overlapping that day
    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        start: { lt: dayEnd },
        end: { gt: dayStart },
      },
      orderBy: { start: "asc" },
    });

    // 2) get bookings overlapping that day that are NOT cancelled
    const bookings = await prisma.booking.findMany({
      where: {
        status: { not: "CANCELLED" },
        start: { lt: dayEnd },
        end: { gt: dayStart },
      },
      select: { start: true, end: true },
      orderBy: { start: "asc" },
    });

    // Turn bookings into blocked ranges (ms)
    const blockedRanges = bookings.map((b) => ({
      start: b.start.getTime(),
      end: b.end.getTime(),
    }));

    // Helper: is [a,b) overlapping any blocked booking?
    const overlapsBlocked = (a: number, b: number) => {
      return blockedRanges.some((r) => a < r.end && b > r.start);
    };

    // 3) produce 30-min start slots inside blocks (that can fit duration)
    const slotMinutes = 30;
    const slots: Array<{ id: string; startISO: string; labelTime: string }> = [];

    for (const block of blocks) {
      // clamp block to day boundaries
      const blockStart = Math.max(block.start.getTime(), dayStart.getTime());
      const blockEnd = Math.min(block.end.getTime(), dayEnd.getTime());

      // walk in 30-min increments
      let t = blockStart;

      // snap to next 30-min boundary
      const ms30 = slotMinutes * 60 * 1000;
      const mod = t % ms30;
      if (mod !== 0) t += ms30 - mod;

      while (t + durationMinutes * 60 * 1000 <= blockEnd) {
        const slotStart = t;
        const slotEnd = t + durationMinutes * 60 * 1000;

        if (!overlapsBlocked(slotStart, slotEnd)) {
          const d = new Date(slotStart);
          slots.push({
            id: `${slotStart}`,
            startISO: d.toISOString(),
            labelTime: d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          });
        }

        t += ms30;
      }
    }

    return NextResponse.json({ ok: true, date, durationMinutes, slots });
  } catch (err) {
    console.error("availability slots error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
