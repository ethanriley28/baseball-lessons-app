import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "COACH") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { bookingId?: string; newStart?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { bookingId, newStart } = body;

  if (!bookingId || !newStart) {
    return NextResponse.json(
      { error: "bookingId and newStart are required" },
      { status: 400 }
    );
  }

  const newStartDate = new Date(newStart);
  if (isNaN(newStartDate.getTime())) {
    return NextResponse.json(
      { error: "Invalid date" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        start: newStartDate,
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: updated.id,
        start: updated.start.toISOString(),
      },
    });
  } catch (err) {
    console.error("Error updating booking date", err);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
