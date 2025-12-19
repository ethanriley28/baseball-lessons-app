import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user || role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const notes = typeof body?.notes === "string" ? body.notes : "";

  const updated = await prisma.booking.update({
    where: { id },
    data: { notes: notes.trim() },
  });

  return NextResponse.json({ ok: true, bookingId: updated.id });
}
