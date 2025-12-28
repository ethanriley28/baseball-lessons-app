import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardTabsClient from "@/components/DashboardTabsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role?: string; name?: string | null };

  // Parent-only dashboard
  if (user.role && user.role !== "PARENT") redirect("/coach");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, role: true },
  });
  if (!dbUser) redirect("/login");
  if (dbUser.role !== "PARENT") redirect("/coach");

  // ✅ Auto-mark past lessons as completed
  const now = new Date();
  await prisma.booking.updateMany({
    where: {
      parentId: dbUser.id,
      status: "CONFIRMED",
      completedAt: null,
      end: { lt: now },
    },
    data: { completedAt: now },
  });

  const players = await prisma.player.findMany({
    where: { parentId: dbUser.id },
    orderBy: { createdAt: "desc" },
    include: { metrics: true },
  });

  // 🔁 NEW PARENT → force Add Player onboarding
  if (players.length === 0) {
    redirect("/onboarding");
  }

  const upcomingBookings = await prisma.booking.findMany({
    where: { parentId: dbUser.id },
    orderBy: { start: "asc" },
    take: 50,
    include: { player: { select: { id: true, name: true } } },
  });

  return (
    <DashboardTabsClient
      parentName={dbUser.name ?? "Parent"}
      players={players as any}
      upcomingBookings={upcomingBookings.map((b) => ({
        id: b.id,
        startISO: b.start.toISOString(),
        endISO: b.end.toISOString(),
        lessonType: (b as any).lessonType ?? null,
        durationMinutes: (b as any).durationMinutes ?? null,
        notes: (b as any).notes ?? null,
        completedAtISO: b.completedAt ? b.completedAt.toISOString() : null,
        paidAtISO: (b as any).paidAt ? (b as any).paidAt.toISOString() : null,
        paymentMethod: (b as any).paymentMethod ?? null,
        player: { id: b.player.id, name: b.player.name },
      }))}
    />
  );
}
