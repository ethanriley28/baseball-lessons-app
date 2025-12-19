import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const bookingId = body?.bookingId as string | undefined;
  const paymentMethod = body?.paymentMethod as string | undefined;

  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      paymentMethod: paymentMethod ?? null,
    },
    select: { id: true, paidAt: true, paymentMethod: true, paymentStatus: true },
  });

  return NextResponse.json({ booking: updated });
}
