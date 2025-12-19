// src/app/coach/player/page.tsx
import { prisma } from "@/lib/prisma";
import { getDemoCoach } from "@/lib/demoUsers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

interface CoachPlayerPageProps {
  searchParams: { id?: string | string[] };
}

export default async function CoachPlayerEditPage({
  searchParams,
}: CoachPlayerPageProps) {
  const coach = await getDemoCoach();
  if (!coach) redirect("/");

  const rawId = searchParams.id;
  const playerId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!playerId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="p-4 border rounded-lg">
          <h1 className="text-2xl font-bold mb-2">No player selected</h1>
          <p className="text-sm text-gray-600">
            Go back to the coach dashboard and choose a player.
          </p>
        </div>
      </main>
    );
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: { metrics: true },
  });

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="p-4 border rounded-lg">
          <h1 className="text-2xl font-bold mb-2">Player not found</h1>
        </div>
      </main>
    );
  }

  const m = player.metrics;

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Edit Metrics: {player.name}</h1>

      <form
        action={updateMetrics}
        className="border rounded-xl p-4 grid grid-cols-2 gap-4 text-sm"
      >
        <input type="hidden" name="playerId" value={player.id} />

        <MetricInput
          label="Tee Exit Velocity (mph)"
          name="teeExitVelo"
          defaultValue={m?.teeExitVelo}
        />
        <MetricInput
          label="Soft Toss Exit Velocity (mph)"
          name="softTossExitVelo"
          defaultValue={m?.softTossExitVelo}
        />
        <MetricInput
          label="60 Time (sec)"
          name="sixtyTime"
          defaultValue={m?.sixtyTime}
        />
        <MetricInput
          label="5-10-5 Time (sec)"
          name="fiveTenFiveTime"
          defaultValue={m?.fiveTenFiveTime}
        />
        <MetricInput
          label="Home to 1st (sec)"
          name="homeToFirstTime"
          defaultValue={m?.homeToFirstTime}
        />
        <MetricInput
          label="Home to 2nd (sec)"
          name="homeToSecondTime"
          defaultValue={m?.homeToSecondTime}
        />

        <button
          type="submit"
          className="col-span-2 mt-2 px-4 py-2 rounded-lg border text-sm font-semibold"
        >
          Save Metrics
        </button>
      </form>
    </main>
  );
}

function MetricInput({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: number | null;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type="number"
        step="0.01"
        name={name}
        defaultValue={defaultValue ?? undefined}
        className="border rounded-md px-2 py-1 text-sm"
      />
    </label>
  );
}

// server action
async function updateMetrics(formData: FormData) {
  "use server";

  const playerId = formData.get("playerId") as string;

  const toNumber = (field: string) => {
    const raw = formData.get(field)?.toString().trim();
    if (!raw) return null;
    const n = Number(raw);
    return isNaN(n) ? null : n;
  };

  await prisma.metrics.upsert({
    where: { playerId },
    update: {
      teeExitVelo: toNumber("teeExitVelo"),
      softTossExitVelo: toNumber("softTossExitVelo"),
      sixtyTime: toNumber("sixtyTime"),
      fiveTenFiveTime: toNumber("fiveTenFiveTime"),
      homeToFirstTime: toNumber("homeToFirstTime"),
      homeToSecondTime: toNumber("homeToSecondTime"),
    },
    create: {
      playerId,
      teeExitVelo: toNumber("teeExitVelo"),
      softTossExitVelo: toNumber("softTossExitVelo"),
      sixtyTime: toNumber("sixtyTime"),
      fiveTenFiveTime: toNumber("fiveTenFiveTime"),
      homeToFirstTime: toNumber("homeToFirstTime"),
      homeToSecondTime: toNumber("homeToSecondTime"),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/coach");
  revalidatePath(`/player?id=${playerId}`);
  revalidatePath(`/coach/player?id=${playerId}`);
}
