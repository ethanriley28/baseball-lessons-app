import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "COACH") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const startISO = String(body?.startISO ?? "");
    const endISO = String(body?.endISO ?? "");

    const start = new Date(startISO);
    const end = new Date(endISO);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json(
        { error: "End must be after start" },
        { status: 400 }
      );
    }

    const created = await prisma.availabilityBlock.create({
      data: { start, end },
    });

    return NextResponse.json({ ok: true, block: created });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
