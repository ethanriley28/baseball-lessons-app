import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { bookingId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { completedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
