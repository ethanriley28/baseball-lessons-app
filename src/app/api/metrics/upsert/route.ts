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

  const playerId = body?.playerId as string | undefined;
  if (!playerId) return NextResponse.json({ error: "Missing playerId" }, { status: 400 });

  const data = {
    teeExitVelo: body?.teeExitVelo ?? null,
    softTossExitVelo: body?.softTossExitVelo ?? null,
    sixtyTime: body?.sixtyTime ?? null,
    fiveTenFiveTime: body?.fiveTenFiveTime ?? null,
    homeToFirstTime: body?.homeToFirstTime ?? null,
    homeToSecondTime: body?.homeToSecondTime ?? null,
  };

  // Upsert the snapshot
  const metrics = await prisma.metrics.upsert({
    where: { playerId },
    create: { playerId, ...data },
    update: { ...data },
  });

  // Create a history entry (only if at least one field was provided)
  const hasAny =
    Object.values(data).some((v) => v !== null && v !== undefined) ||
    Boolean((body?.notes as string | null | undefined)?.trim());

  if (hasAny) {
    await prisma.metricsEntry.create({
      data: {
        playerId,
        teeExitVelo: data.teeExitVelo,
        softTossExitVelo: data.softTossExitVelo,
        sixtyTime: data.sixtyTime,
        fiveTenFiveTime: data.fiveTenFiveTime,
        homeToFirstTime: data.homeToFirstTime,
        homeToSecondTime: data.homeToSecondTime,
      },
    });
  }

  return NextResponse.json({ metrics });
}
