// src/app/api/bookings/cancel/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const bookingId = body?.bookingId as string | undefined;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Only allow the parent who owns it (or a coach) to cancel
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, parentId: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const role = (session.user as any).role as string | undefined;
    const userId = (session.user as any).id as string | undefined;

    const canCancel =
      role === "COACH" || (role === "PARENT" && userId && booking.parentId === userId);

    if (!canCancel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ ok: true, booking: updated });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
