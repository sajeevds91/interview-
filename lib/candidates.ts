import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { sendEmail } from "./email";
import { buildIcs } from "./ics";
import { getRole } from "./roles";
import type { Application, ScoreResult } from "./roles/types";
import { getSettings, type Settings } from "./settings";
import { generateSlots } from "./slots";
import { fmtDateTime } from "./time";

export type Status =
  | "new"
  | "shortlisted"
  | "invited"
  | "scheduled"
  | "interviewed"
  | "offer"
  | "hired"
  | "rejected";

export const STATUSES: { value: Status; label: string }[] = [
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "invited", label: "Invite sent" },
  { value: "scheduled", label: "Interview booked" },
  { value: "interviewed", label: "Interviewed" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Not progressing" },
];

export type Candidate = {
  id: string;
  role: string;
  createdAt: string;
  app: Application;
  status: Status;
  manualRating?: number;
  notes: string;
  schedulingToken?: string;
  invitedAt?: string;
  interview?: { start: string; end: string; meetingUrl: string; bookedAt: string; sequence: number };
  duplicateOf?: string;
  history: { at: string; text: string }[];
};

export type ScoredCandidate = Candidate & { score: ScoreResult };

const baseUrl = () => (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const firstName = (c: Candidate) => c.app.name.split(/\s+/)[0];

export function scoreCandidate(c: Candidate, s: Settings): ScoreResult {
  const role = getRole(c.role);
  if (!role) return { total: 0, lines: [], flags: ["Unknown role"], strengths: [], band: "weak" };
  const r = role.score(c.app, s);
  if (c.duplicateOf) r.flags = [...r.flags, "Applied more than once"];
  return r;
}

export async function listCandidates(): Promise<ScoredCandidate[]> {
  const [all, s] = await Promise.all([db.list<Candidate>("candidates"), getSettings()]);
  return all.map((c) => ({ ...c, score: scoreCandidate(c, s) }));
}

export async function getCandidate(id: string): Promise<ScoredCandidate | null> {
  const c = await db.get<Candidate>("candidates", id);
  if (!c) return null;
  return { ...c, score: scoreCandidate(c, await getSettings()) };
}

async function save(c: Candidate, event?: string) {
  if (event) c.history = [...(c.history ?? []), { at: new Date().toISOString(), text: event }];
  await db.put("candidates", c.id, c);
}

export async function createCandidate(roleSlug: string, app: Application) {
  const existing = (await db.list<Candidate>("candidates")).find((c) => c.role === roleSlug && c.app.email === app.email);
  const c: Candidate = {
    id: crypto.randomUUID(),
    role: roleSlug,
    createdAt: new Date().toISOString(),
    app,
    status: "new",
    notes: "",
    duplicateOf: existing?.id,
    history: [],
  };
  await save(c, "Application submitted");

  const settings = await getSettings();
  const score = scoreCandidate(c, settings);
  const role = getRole(roleSlug)!;

  await sendEmail({
    candidateId: c.id,
    to: app.email,
    subject: `We've received your application — ${role.title} at ${settings.companyName}`,
    text: `Hi ${firstName(c)},\n\nThanks for applying for the ${role.title} role at ${settings.companyName}. We review every application and will get back to you if your profile matches what we need.\n\nBest regards,\n${settings.companyName}`,
  });
  if (process.env.ADMIN_NOTIFY_EMAIL) {
    await sendEmail({
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `New ${role.title} applicant: ${app.name} — ${score.total}/100`,
      text: `${app.name} (${app.location}) scored ${score.total}/100.\nSalary: LKR ${app.salaryExpectation.toLocaleString()} · Notice: ${app.noticePeriod}\nRed flags: ${score.flags.length ? score.flags.join("; ") : "none"}`,
      cta: { label: "Review candidate", url: `${baseUrl()}/admin/candidates/${c.id}` },
    });
  }

  if (settings.autoInviteThreshold > 0 && score.total >= settings.autoInviteThreshold && score.flags.length === 0) {
    await inviteToInterview(c.id, "Auto-invited (score above threshold, no red flags)");
  }
  return c;
}

export async function updateCandidate(id: string, patch: Partial<Pick<Candidate, "status" | "notes" | "manualRating">>, event?: string) {
  const c = await db.get<Candidate>("candidates", id);
  if (!c) throw new Error("Candidate not found");
  Object.assign(c, patch);
  await save(c, event);
}

export async function deleteCandidate(id: string) {
  await db.del("candidates", id);
}

/** Select a candidate: email them a link to book an interview slot. */
export async function inviteToInterview(id: string, event = "Selected — interview booking link sent") {
  const c = await db.get<Candidate>("candidates", id);
  if (!c) throw new Error("Candidate not found");
  const s = await getSettings();
  const role = getRole(c.role)!;
  c.schedulingToken ??= crypto.randomBytes(18).toString("base64url");
  c.invitedAt = new Date().toISOString();
  if (c.status !== "scheduled") c.status = "invited";
  await save(c, event);
  const link = `${baseUrl()}/schedule/${c.schedulingToken}`;
  await sendEmail({
    candidateId: c.id,
    to: c.app.email,
    subject: `Interview invitation — ${role.title} at ${s.companyName}`,
    text: `Hi ${firstName(c)},\n\nThank you for applying for the ${role.title} role. We'd like to invite you to a ${s.durationMinutes}-minute online interview with ${s.interviewerName}.${s.inviteNote ? `\n\n${s.inviteNote}` : ""}\n\nPlease choose a time that suits you using the link below. You'll get a calendar invite and the video link straight away.\n\nBest regards,\n${s.companyName}`,
    cta: { label: "Choose an interview time", url: link },
  });
}

async function bookedStarts(exceptId?: string) {
  const all = await db.list<Candidate>("candidates");
  return all.filter((c) => c.id !== exceptId && c.status === "scheduled" && c.interview).map((c) => c.interview!.start);
}

export async function findByToken(token: string) {
  if (!token || token.length < 10) return null;
  const all = await db.list<Candidate>("candidates");
  return all.find((c) => c.schedulingToken === token) ?? null;
}

export async function openSlots(forCandidateId?: string) {
  const s = await getSettings();
  return generateSlots(s, await bookedStarts(forCandidateId));
}

function meetingUrlFor(c: Candidate, s: Settings) {
  if (s.meetingMode === "fixed" && s.meetingUrl) return s.meetingUrl;
  const room = `Divide-Interview-${c.app.name.replace(/[^A-Za-z]/g, "")}-${c.id.slice(0, 8)}`;
  return `https://meet.jit.si/${room}`;
}

/** Candidate books (or reschedules to) a slot. */
export async function bookSlot(token: string, startIso: string) {
  const c = await findByToken(token);
  if (!c) return { ok: false as const, error: "This booking link is no longer valid." };
  if (["rejected", "hired"].includes(c.status)) return { ok: false as const, error: "This booking link is no longer active." };
  const s = await getSettings();
  const slots = await openSlots(c.id);
  if (!slots.includes(startIso)) return { ok: false as const, error: "Sorry, that time was just taken. Please choose another." };

  const start = new Date(startIso);
  const end = new Date(start.getTime() + s.durationMinutes * 60_000);
  const rescheduled = Boolean(c.interview && c.status === "scheduled");
  c.interview = {
    start: start.toISOString(),
    end: end.toISOString(),
    meetingUrl: meetingUrlFor(c, s),
    bookedAt: new Date().toISOString(),
    sequence: (c.interview?.sequence ?? -1) + 1,
  };
  c.status = "scheduled";
  await save(c, `${rescheduled ? "Rescheduled" : "Booked"} interview for ${fmtDateTime(start)}`);

  const role = getRole(c.role)!;
  const ics = buildIcs({
    uid: `interview-${c.id}@divide`,
    sequence: c.interview.sequence,
    start,
    end,
    title: `${s.companyName} interview — ${role.title} (${c.app.name})`,
    description: `Online interview for the ${role.title} role.\nJoin: ${c.interview.meetingUrl}`,
    location: c.interview.meetingUrl,
    organizerEmail: process.env.ADMIN_NOTIFY_EMAIL || undefined,
    attendees: [
      { name: c.app.name, email: c.app.email },
      ...(process.env.ADMIN_NOTIFY_EMAIL ? [{ name: s.companyName, email: process.env.ADMIN_NOTIFY_EMAIL }] : []),
    ],
  });
  const when = `${fmtDateTime(start)} (Sri Lanka time)`;
  await sendEmail({
    candidateId: c.id,
    to: c.app.email,
    subject: `Interview confirmed — ${when}`,
    text: `Hi ${firstName(c)},\n\nYour interview for the ${role.title} role is confirmed for ${when}. It will take about ${s.durationMinutes} minutes.\n\nJoin the video call here: ${c.interview.meetingUrl}\n\nA calendar invite is attached. If you need to change the time, use your booking link: ${baseUrl()}/schedule/${token}\n\nBest regards,\n${s.companyName}`,
    ics,
  });
  if (process.env.ADMIN_NOTIFY_EMAIL) {
    await sendEmail({
      candidateId: c.id,
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: `Interview ${rescheduled ? "rescheduled" : "booked"}: ${c.app.name} — ${when}`,
      text: `${c.app.name} booked an interview for the ${role.title} role on ${when}.\nVideo link: ${c.interview.meetingUrl}`,
      cta: { label: "Open candidate", url: `${baseUrl()}/admin/candidates/${c.id}` },
      ics,
    });
  }
  return { ok: true as const, interview: c.interview };
}

export async function cancelInterview(id: string) {
  const c = await db.get<Candidate>("candidates", id);
  if (!c?.interview) return;
  const s = await getSettings();
  const role = getRole(c.role)!;
  const ics = buildIcs({
    uid: `interview-${c.id}@divide`,
    sequence: c.interview.sequence + 1,
    start: new Date(c.interview.start),
    end: new Date(c.interview.end),
    title: `${s.companyName} interview — ${role.title} (${c.app.name})`,
    description: "Cancelled",
    location: c.interview.meetingUrl,
    attendees: [{ name: c.app.name, email: c.app.email }],
    method: "CANCEL",
  });
  const when = fmtDateTime(c.interview.start);
  c.interview = undefined;
  c.status = "invited";
  await save(c, `Interview on ${when} cancelled; booking link still open`);
  await sendEmail({
    candidateId: c.id,
    to: c.app.email,
    subject: `Interview time cancelled — please pick a new time`,
    text: `Hi ${firstName(c)},\n\nWe need to move your interview that was set for ${when}. Sorry for the inconvenience. Please choose a new time using the link below.\n\nBest regards,\n${s.companyName}`,
    cta: { label: "Choose a new time", url: `${baseUrl()}/schedule/${c.schedulingToken}` },
    ics,
  });
}

export async function rejectCandidate(id: string, notify: boolean) {
  const c = await db.get<Candidate>("candidates", id);
  if (!c) return;
  const s = await getSettings();
  const role = getRole(c.role)!;
  c.status = "rejected";
  await save(c, notify ? "Marked not progressing — candidate emailed" : "Marked not progressing (no email)");
  if (notify) {
    await sendEmail({
      candidateId: c.id,
      to: c.app.email,
      subject: `Your application — ${role.title} at ${s.companyName}`,
      text: `Hi ${firstName(c)},\n\nThank you for your interest in the ${role.title} role and for taking the time to apply. After reviewing all applications, we've decided not to move forward with yours on this occasion.\n\nWe wish you every success.\n\nBest regards,\n${s.companyName}`,
    });
  }
}
