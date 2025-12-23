// src/lib/dates.ts

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * IMPORTANT: This makes a YYYY-MM-DD key in the *user’s local timezone*.
 * Do NOT use toISOString() for day grouping (that groups by UTC and shifts dates).
 */
export function localDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatLocalDate(isoOrDate: string | Date) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "numeric", day: "numeric" });
}

export function formatLocalTime(isoOrDate: string | Date) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatLocalTimeRange(startISO: string, endISO: string) {
  return `${formatLocalTime(startISO)} – ${formatLocalTime(endISO)}`;
}
