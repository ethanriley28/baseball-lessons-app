import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Body = {
  startISO?: string;
  endISO?: string;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Require login + COACH role
    if (!session?.user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const role = (session.user as any).role as string | undefined;
    if (role !== "COACH") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await req.json()) as Body;

    if (!body.startISO || !body.endISO) {
      return NextResponse.json(
        { error: "Missing startISO or endISO" },
        { status: 400 }
      );
    }

    const start = new Date(body.startISO);
    const end = new Date(body.endISO);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format (must be ISO strings)" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const created = await prisma.availabilityBlock.create({
      data: { start, end },
      select: { id: true, start: true, end: true },
    });

    return NextResponse.json({ ok: true, block: created });
  } catch (err: any) {
    // This WILL show in Vercel function logs
    console.error("API /availability/add error:", err);

    return NextResponse.json(
      {
        error: "Server error adding availability",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
