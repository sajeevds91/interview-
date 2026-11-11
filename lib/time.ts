/** Sri Lanka is UTC+05:30 with no daylight saving. */
export const TZ = "Asia/Colombo";
const OFFSET_MIN = 330;

/** Build a UTC Date from a Colombo-local date (YYYY-MM-DD) and time (HH:MM). */
export function colomboToUtc(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - OFFSET_MIN * 60_000);
}

/** Colombo-local calendar parts for a UTC instant. */
export function colomboParts(at: Date) {
  const local = new Date(at.getTime() + OFFSET_MIN * 60_000);
  return {
    date: local.toISOString().slice(0, 10),
    time: local.toISOString().slice(11, 16),
    weekday: local.getUTCDay(),
  };
}

export function fmtDateTime(iso: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function fmtDay(iso: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(
    new Date(iso),
  );
}

export function fmtTime(iso: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
