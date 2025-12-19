import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function toFloat(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const playerId = body?.playerId as string | undefined;
  const m = body?.metrics ?? {};

  if (!playerId) {
    return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
  }

  const data = {
    teeExitVelo: toFloat(m.teeExitVelo),
    softTossExitVelo: toFloat(m.softTossExitVelo),
    sixtyTime: toFloat(m.sixtyTime),
    fiveTenFiveTime: toFloat(m.fiveTenFiveTime),
    homeToFirstTime: toFloat(m.homeToFirstTime),
    homeToSecondTime: toFloat(m.homeToSecondTime),
  };

  // 1) Update current snapshot
  await prisma.metrics.upsert({
    where: { playerId },
    update: data,
    create: { playerId, ...data },
  });

  // 2) Append to history (only if at least one value is provided)
  const hasAny =
    Object.values(data).some((v) => v !== null && v !== undefined);

  if (hasAny) {
    await prisma.metricsEntry.create({
      data: { playerId, ...data },
    });
  }

  return NextResponse.json({ ok: true });
}
