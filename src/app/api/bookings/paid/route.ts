import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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
  });

  return NextResponse.json({
    ok: true,
    paidAtISO: updated.paidAt?.toISOString() ?? null,
    paymentMethod: updated.paymentMethod ?? null,
  });
}
