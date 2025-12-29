// src/app/api/bookings/reschedule/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const bookingId = body?.bookingId as string | undefined;
    const newStartISO = body?.newStartISO as string | undefined;

    if (!bookingId || !newStartISO) {
      return NextResponse.json(
        { error: "Missing bookingId or newStartISO" },
        { status: 400 }
      );
    }

    const role = (session.user as any).role as string | undefined;
    const userId = (session.user as any).id as string | undefined;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        parentId: true,
        status: true,
        durationMinutes: true,
        start: true,
        end: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const canReschedule =
      role === "COACH" || (role === "PARENT" && userId && booking.parentId === userId);

    if (!canReschedule) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json({ error: "Booking is cancelled" }, { status: 400 });
    }

    const newStart = new Date(newStartISO);
    if (Number.isNaN(newStart.getTime())) {
      return NextResponse.json({ error: "Invalid newStartISO" }, { status: 400 });
    }

    const duration = booking.durationMinutes ?? 60;
    const newEnd = new Date(newStart.getTime() + duration * 60_000);

    // ✅ Must be inside an availability block
    const okAvailability = await prisma.availabilityBlock.findFirst({
      where: {
        start: { lte: newStart },
        end: { gte: newEnd },
      },
      select: { id: true },
    });

    if (!okAvailability) {
      return NextResponse.json(
        { error: "That time is not in coach availability." },
        { status: 400 }
      );
    }

    // ✅ Must not overlap another CONFIRMED booking
    const conflicting = await prisma.booking.findMany({
      where: {
        id: { not: booking.id },
        status: "CONFIRMED",
      },
      select: { start: true, end: true },
    });

    const hasConflict = conflicting.some((b) => overlaps(newStart, newEnd, b.start, b.end));
    if (hasConflict) {
      return NextResponse.json(
        { error: "That time overlaps another booking." },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        start: newStart,
        end: newEnd,
        status: "CONFIRMED",
        completedAt: null, // reschedule means it's not completed anymore
      },
    });

    return NextResponse.json({
      ok: true,
      booking: {
        id: updated.id,
        startISO: updated.start.toISOString(),
        endISO: updated.end.toISOString(),
      },
    });
  } catch (err) {
    console.error("Reschedule booking error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
