import "server-only";
import { db } from "./db";

export type Settings = {
  companyName: string;
  interviewerName: string;
  /** "jitsi" = auto-generate a free Jitsi Meet room per interview; "fixed" = use meetingUrl */
  meetingMode: "jitsi" | "fixed";
  meetingUrl: string;
  durationMinutes: number;
  /** 0 = Sunday … 6 = Saturday */
  workingDays: number[];
  dayStart: string; // "10:00" Colombo time
  dayEnd: string; // "16:00"
  daysAhead: number;
  minNoticeHours: number;
  salaryBudgetMin: number;
  salaryBudgetMax: number;
  /** Auto-send an interview booking link when score >= this and there are no red flags. 0 = off */
  autoInviteThreshold: number;
  inviteNote: string;
  sendRejectionEmails: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  companyName: "Divide",
  interviewerName: "the Divide team",
  meetingMode: "jitsi",
  meetingUrl: "",
  durationMinutes: 30,
  workingDays: [1, 2, 3, 4, 5],
  dayStart: "10:00",
  dayEnd: "16:00",
  daysAhead: 10,
  minNoticeHours: 24,
  salaryBudgetMin: 0,
  salaryBudgetMax: 0,
  autoInviteThreshold: 0,
  inviteNote: "",
  sendRejectionEmails: true,
};

export async function getSettings(): Promise<Settings> {
  const s = await db.get<Settings>("settings", "main");
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}

export async function saveSettings(s: Settings) {
  await db.put("settings", "main", s);
}
