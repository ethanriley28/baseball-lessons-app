export const APP_TZ =
  process.env.NEXT_PUBLIC_APP_TZ || "America/Chicago";

export function fmtDate(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function fmtTime(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function fmtTimeRange(startISO: string, endISO: string) {
  return `${fmtTime(startISO)} - ${fmtTime(endISO)}`;
}
