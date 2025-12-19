import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type PlayerPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function MetricBox(props: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 12,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280" }}>
        {props.label}
      </div>
      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900, color: "#111827" }}>
        {props.value}
      </div>
    </div>
  );
}
import { revalidatePath } from "next/cache";

async function updateBookingNotes(formData: FormData) {
  "use server";

  const bookingId = formData.get("bookingId")?.toString();
  const playerId = formData.get("playerId")?.toString();
  const notes = formData.get("notes")?.toString() ?? "";

  if (!bookingId || !playerId) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { notes: notes.trim() },
  });

  revalidatePath(`/player?id=${playerId}`);
}

export default async function PlayerPage({ searchParams }: PlayerPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Next.js 16: searchParams is a Promise
  const sp = (await searchParams) ?? {};
  const rawId = sp.id;
  const playerId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  if (!playerId) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>No player selected</h1>
        <p style={{ fontSize: 14, color: "#4b5563" }}>
          This page expects a URL like <b>/player?id=&lt;playerId&gt;</b>.
        </p>
        <Link href="/dashboard" style={{ color: "#2563eb", fontWeight: 800 }}>
          ← Back to Dashboard
        </Link>
      </main>
    );
  }

  const user = session.user as any;
  const role = user?.role ?? "PARENT";
  const isCoach = role === "COACH";

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      parent: true,
      metrics: true,
      metricsHistory: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!player) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Player not found</h1>
        <p style={{ fontSize: 14, color: "#4b5563" }}>
          We couldn&apos;t load this player. Go back and select the player again.
        </p>
        <Link href="/dashboard" style={{ color: "#2563eb", fontWeight: 800 }}>
          ← Back to Dashboard
        </Link>
      </main>
    );
  }

  // Parent safety: parent can only view their own player
  if (!isCoach && player.parentId !== user.id) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Not allowed</h1>
        <p style={{ fontSize: 14, color: "#4b5563" }}>
          You don&apos;t have permission to view this player.
        </p>
        <Link href="/dashboard" style={{ color: "#2563eb", fontWeight: 800 }}>
          ← Back to Dashboard
        </Link>
      </main>
    );
  }

  // Step 2: bookings for Session Notes later (and for upcoming sections if you want)
  const bookings = await prisma.booking.findMany({
    where: { playerId: player.id },
    orderBy: { start: "desc" },
    take: 50,
  });

  // Step 3: Last updated timestamp for metrics
  const lastMetricsUpdatedAt =
    (player as any).metricsHistory?.[0]?.createdAt ??
    (player as any).metrics?.updatedAt ??
    (player as any).updatedAt ??
    player.createdAt;

  const lastMetricsUpdatedLabel = new Date(lastMetricsUpdatedAt).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <main style={{ padding: 18 }}>
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#111827" }}>
              {player.name}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
              Player profile & performance
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href={isCoach ? "/coach" : "/dashboard"}
              style={{
                textDecoration: "none",
                fontWeight: 900,
                color: "#111827",
                border: "1px solid #e5e7eb",
                background: "#fff",
                padding: "10px 12px",
                borderRadius: 12,
              }}
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* =======================
            METRICS OVERVIEW
        ======================= */}
        <section
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            marginTop: 16,
          }}
        >
          {/* Current Metrics header + Last Updated */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#111827" }}>
              Current Metrics
            </h2>

            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Last updated: {lastMetricsUpdatedLabel}
            </span>
          </div>

          {/* Current Metrics grid */}
          {player.metrics ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <MetricBox
                label="Tee EV"
                value={
                  player.metrics.teeExitVelo != null
                    ? `${player.metrics.teeExitVelo} mph`
                    : "-"
                }
              />
              <MetricBox
                label="Soft Toss EV"
                value={
                  player.metrics.softTossExitVelo != null
                    ? `${player.metrics.softTossExitVelo} mph`
                    : "-"
                }
              />
              <MetricBox
                label="60 Time"
                value={
                  player.metrics.sixtyTime != null
                    ? `${player.metrics.sixtyTime} s`
                    : "-"
                }
              />
              <MetricBox
                label="5-10-5"
                value={
                  player.metrics.fiveTenFiveTime != null
                    ? `${player.metrics.fiveTenFiveTime} s`
                    : "-"
                }
              />
              <MetricBox
                label="Home–1st"
                value={
                  player.metrics.homeToFirstTime != null
                    ? `${player.metrics.homeToFirstTime} s`
                    : "-"
                }
              />
              <MetricBox
                label="Home–2nd"
                value={
                  player.metrics.homeToSecondTime != null
                    ? `${player.metrics.homeToSecondTime} s`
                    : "-"
                }
              />
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              No current metrics recorded yet.
            </p>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "#eef2f7", margin: "16px 0" }} />

          {/* Recent Sessions */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#111827" }}>
                Recent Sessions
              </h3>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Last {Math.min(player.metricsHistory.length, 10)} updates
              </span>
            </div>

            {player.metricsHistory.length === 0 ? (
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                No session history yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {player.metricsHistory.slice(0, 10).map((entry: any, idx: number) => {
                  const dateLabel = new Date(entry.createdAt).toLocaleString(undefined, {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  const rows: { label: string; value: string }[] = [];
                  if (entry.teeExitVelo != null) rows.push({ label: "Tee EV", value: `${entry.teeExitVelo} mph` });
                  if (entry.softTossExitVelo != null) rows.push({ label: "Soft Toss EV", value: `${entry.softTossExitVelo} mph` });
                  if (entry.sixtyTime != null) rows.push({ label: "60 Time", value: `${entry.sixtyTime} s` });
                  if (entry.fiveTenFiveTime != null) rows.push({ label: "5-10-5", value: `${entry.fiveTenFiveTime} s` });
                  if (entry.homeToFirstTime != null) rows.push({ label: "Home–1st", value: `${entry.homeToFirstTime} s` });
                  if (entry.homeToSecondTime != null) rows.push({ label: "Home–2nd", value: `${entry.homeToSecondTime} s` });

                  return (
                    <div
                      key={entry.id ?? idx}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        background: "#f9fafb",
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>
                          {dateLabel}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: 10,
                        }}
                      >
                        {rows.map((r, i) => (
                          <div
                            key={i}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: 12,
                              padding: 10,
                              background: "#fff",
                            }}
                          >
                            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
                              {r.label}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: "#111827", marginTop: 4 }}>
                              {r.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* (Optional) bookings debug for later Step 4 - safe to leave */}
        {/* =======================
    SESSION NOTES
======================= */}
<section
  style={{
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 12,
      marginBottom: 10,
    }}
  >
    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#111827" }}>
      Session Notes
    </h2>
    <span style={{ fontSize: 12, color: "#6b7280" }}>
      Latest {Math.min(bookings.length, 12)} lessons
    </span>
  </div>

  {bookings.length === 0 ? (
    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
      No lessons yet for this player.
    </p>
  ) : (
    <div style={{ display: "grid", gap: 12 }}>
      {bookings.slice(0, 12).map((b: any) => {
        const dateLabel = new Date(b.start).toLocaleString(undefined, {
          month: "numeric",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        const noteLines =
          (b.notes ?? "")
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean) ?? [];

        return (
          <div
            key={b.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              background: "#f9fafb",
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>
                {dateLabel}
              </div>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {(b.lessonType ?? "Lesson") + (b.durationMinutes ? ` · ${b.durationMinutes} min` : "")}
              </div>
            </div>

            {/* Parent view: bullets only */}
            {!isCoach ? (
              noteLines.length > 0 ? (
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13 }}>
                  {noteLines.map((line: string, i: number) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: "10px 0 0", fontSize: 13, color: "#6b7280" }}>
                  No notes added yet.
                </p>
              )
            ) : (
              // Coach view: editable textarea + save
              <form action={updateBookingNotes} style={{ marginTop: 10 }}>
                <input type="hidden" name="bookingId" value={b.id} />
                <input type="hidden" name="playerId" value={player.id} />

                <textarea
                  name="notes"
                  defaultValue={b.notes ?? ""}
                  placeholder={"Add notes (one bullet per line)\nExample:\n- Worked inside-out swings\n- Tee work: middle/in\n- Finish with 10 soft toss reps"}
                  rows={5}
                  style={{
                    width: "100%",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                    background: "#fff",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #111827",
                      background: "#111827",
                      color: "#fff",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Save Notes
                  </button>
                </div>

                {noteLines.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>
                      Preview (parent view)
                    </div>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13 }}>
                      {noteLines.map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            )}
          </div>
        );
      })}
    </div>
  )}
</section>
      </div>
    </main>
  );
}
