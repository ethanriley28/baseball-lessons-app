import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const bookingId = body?.bookingId as string | undefined;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        parentId: true,
        start: true,
        status: true,
        paidAt: true,
        completedAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ✅ Only the booking owner (parent) can cancel from parent dashboard
    const userId = (session.user as any).id as string | undefined;
    const role = (session.user as any).role as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Session missing user id" }, { status: 401 });
    }

    if (role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can cancel here" }, { status: 403 });
    }

    if (booking.parentId !== userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // ✅ Optional guard: prevent canceling already completed lessons
    if (booking.completedAt) {
      return NextResponse.json(
        { error: "This lesson is already completed and cannot be cancelled here." },
        { status: 400 }
      );
    }

    // ✅ Optional guard: prevent canceling paid lessons (you can remove this if you want)
    if (booking.paidAt) {
      return NextResponse.json(
        { error: "This lesson is marked paid. Cancel from coach side if needed." },
        { status: 400 }
      );
    }

    // ✅ Mark it cancelled (don’t delete)
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Cancel booking error:", e);
    return NextResponse.json(
      { error: "Server error cancelling lesson" },
      { status: 500 }
    );
  }
}
