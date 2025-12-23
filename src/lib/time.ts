export const APP_TZ = "America/Chicago"; // change if you want later

export function formatDateLabel(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatTimeLabel(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

// Key used for grouping by day in the chosen TZ (YYYY-MM-DD)
export function dayKey(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find(p => p.type === "year")?.value;
  const m = parts.find(p => p.type === "month")?.value;
  const da = parts.find(p => p.type === "day")?.value;
  return `${y}-${m}-${da}`;
}
