// src/app/book/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import BookClient from "./BookClient";

type Slot = {
  id: string;
  dateKey: string;
  labelDate: string;
  labelTime: string;
  startISO: string;
};

export default async function BookPage() {
  // ✅ real logged-in parent
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/book");

  const user = session.user as { id: string; role?: string };
  if (user.role && user.role !== "PARENT") redirect("/coach");

  const parentId = user.id;

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [players, availabilityBlocks, bookings] = await Promise.all([
    prisma.player.findMany({
      where: { parentId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.availabilityBlock.findMany({
      where: {
        // only blocks that intersect the next 7 days
        start: { lt: windowEnd },
        end: { gt: now },
      },
      orderBy: { start: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        start: { lt: windowEnd },
        end: { gt: now },
      },
      orderBy: { start: "asc" },
    }),
  ]);

 const slots = generateSlots(availabilityBlocks, bookings, 7);


  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    acc[slot.dateKey] = acc[slot.dateKey] || [];
    acc[slot.dateKey].push(slot);
    return acc;
  }, {});

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Book a Lesson
      </h1>
      <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
        Select your player and session details, then choose an available time.
      </p>

      {players.length === 0 ? (
        <p style={{ fontSize: 13, color: "#555" }}>
          You need to add a player first on the dashboard before booking a
          lesson.
        </p>
      ) : slots.length === 0 ? (
        <p style={{ fontSize: 13, color: "#555" }}>
          Coach doesn&apos;t have any open availability in the next 7 days. Ask
          Coach to add availability on the calendar.
        </p>
      ) : (
  <BookClient
    players={players.map((p) => ({ id: p.id, name: p.name }))}
    slots={slots}
    action={createBooking}
  />
)}
</main>
  );
}

// ---------------- helpers ----------------

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateSlots(
  availabilityBlocks: any[],
  bookings: any[],
  daysAhead = 7
): Slot[] {
  const slots: Slot[] = [];
  const now = new Date();
  const windowEnd = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const stepMs = 30 * 60 * 1000;

  for (const block of availabilityBlocks) {
    const blockStart = new Date(block.start);
    const blockEnd = new Date(block.end);

    const start = new Date(Math.max(blockStart.getTime(), now.getTime()));
    const end = new Date(Math.min(blockEnd.getTime(), windowEnd.getTime()));
    if (end <= start) continue;

    let slotStart = new Date(start);

    // snap to :00 or :30
    const mins = slotStart.getMinutes();
    slotStart.setMinutes(mins < 30 ? 30 : 0, 0, 0);
    if (mins >= 30) slotStart.setHours(slotStart.getHours() + 1);

    while (slotStart.getTime() + stepMs <= end.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + stepMs);

      const conflict = bookings.some((b) => {
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return b.status === "CONFIRMED" && bStart < slotEnd && bEnd > slotStart;
      });

      if (!conflict) {
        slots.push({
          id: slotStart.toISOString(),
          dateKey: localDateKey(slotStart),
          labelDate: slotStart.toLocaleDateString(undefined, {
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}),
labelTime: slotStart.toLocaleTimeString(undefined, {
  hour: "numeric",
  minute: "2-digit",
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}),

          startISO: slotStart.toISOString(),
        });
      }

      slotStart = new Date(slotStart.getTime() + stepMs);
    }
  }

  return slots.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

// ---------------- server action ----------------

async function createBooking(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/book");

  const user = session.user as { id: string; role?: string };
  if (user.role && user.role !== "PARENT") redirect("/coach");

  const parentId = user.id;

  const playerId = formData.get("playerId")?.toString() || "";
  const slotStartRaw = formData.get("slotStart")?.toString() || "";
  const durationRaw = formData.get("durationMinutes")?.toString() || "60";
  const lessonType = formData.get("lessonType")?.toString() || "Hitting";

  if (!playerId || !slotStartRaw) return;

  const start = new Date(slotStartRaw);
  const durationMinutes = parseInt(durationRaw, 10) || 60;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const conflict = await prisma.booking.findFirst({
    where: {
      status: "CONFIRMED",
      start: { lt: end },
      end: { gt: start },
    },
  });
  if (conflict) return;

  await prisma.booking.create({
    data: {
      playerId,
      parentId,
      start,
      end,
      status: "CONFIRMED",
      durationMinutes,
      lessonType,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/coach/calendar");
  revalidatePath("/book");

    redirect("/dashboard?booked=1&tab=upcoming");

}
