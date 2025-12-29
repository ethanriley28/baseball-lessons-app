import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role && user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const bookingId = body?.bookingId as string | undefined;
  const newStartISO = body?.newStartISO as string | undefined;

  if (!bookingId || !newStartISO) {
    return NextResponse.json({ error: "Missing bookingId or newStartISO" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      parentId: true,
      playerId: true,
      durationMinutes: true,
      status: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.parentId !== user.id) return NextResponse.json({ error: "Not your booking" }, { status: 403 });

  const duration = booking.durationMinutes ?? 60;

  const start = new Date(newStartISO);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid newStartISO" }, { status: 400 });
  }
  const end = new Date(start.getTime() + duration * 60 * 1000);

  // ✅ must fit inside an availability block
  const block = await prisma.availabilityBlock.findFirst({
    where: {
      start: { lte: start },
      end: { gte: end },
    },
    select: { id: true },
  });

  if (!block) {
    return NextResponse.json({ error: "Slot is not available" }, { status: 409 });
  }

  // ✅ must not overlap other bookings
  const overlap = await prisma.booking.findFirst({
    where: {
      id: { not: booking.id },
      status: "CONFIRMED",
      OR: [
        { start: { lt: end }, end: { gt: start } }, // overlaps
      ],
    },
    select: { id: true },
  });

  if (overlap) {
    return NextResponse.json({ error: "Time overlaps another booking" }, { status: 409 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      start,
      end,
      status: "CONFIRMED",
      completedAt: null, // reschedule means it's upcoming again
    },
    select: { id: true, start: true, end: true },
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: updated.id,
      startISO: updated.start.toISOString(),
      endISO: updated.end.toISOString(),
    },
  });
}
