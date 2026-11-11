import { colomboParts, colomboToUtc } from "./time";

export type SlotConfig = {
  durationMinutes: number;
  workingDays: number[];
  dayStart: string;
  dayEnd: string;
  daysAhead: number;
  minNoticeHours: number;
};

/** Open interview slots (UTC ISO strings), excluding already-booked start times. */
export function generateSlots(cfg: SlotConfig, booked: string[], now = new Date()): string[] {
  const taken = new Set(booked.map((b) => new Date(b).getTime()));
  const earliest = now.getTime() + cfg.minNoticeHours * 3_600_000;
  const out: string[] = [];
  const startDay = colomboParts(now).date;
  for (let i = 0; i <= cfg.daysAhead; i++) {
    const day = new Date(Date.parse(startDay + "T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10);
    const weekday = new Date(day + "T00:00:00Z").getUTCDay();
    if (!cfg.workingDays.includes(weekday)) continue;
    const end = colomboToUtc(day, cfg.dayEnd).getTime();
    for (let t = colomboToUtc(day, cfg.dayStart).getTime(); t + cfg.durationMinutes * 60_000 <= end; t += cfg.durationMinutes * 60_000) {
      if (t < earliest || taken.has(t)) continue;
      out.push(new Date(t).toISOString());
    }
  }
  return out;
}
