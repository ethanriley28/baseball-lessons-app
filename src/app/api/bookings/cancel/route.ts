import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role && user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : null;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Must belong to this parent
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        parentId: user.id,
      },
      select: {
        id: true,
        start: true,
        end: true,
        status: true,
        completedAt: true,
        paidAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Don't allow cancelling completed lessons
    if (booking.completedAt) {
      return NextResponse.json(
        { error: "Cannot cancel a completed lesson." },
        { status: 400 }
      );
    }

    // Only cancel upcoming (start must be in the future)
    const now = new Date();
    if (booking.start <= now) {
      return NextResponse.json(
        { error: "Cannot cancel a lesson that already started/passed." },
        { status: 400 }
      );
    }

    // Already cancelled?
    if (booking.status === "CANCELLED") {
      return NextResponse.json({ ok: true, alreadyCancelled: true });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
