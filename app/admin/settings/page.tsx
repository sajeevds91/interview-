import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { emailConfigured } from "@/lib/email";
import { getSettings, saveSettings, type Settings } from "@/lib/settings";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const num = (v: FormDataEntryValue | null, d = 0) => (Number.isFinite(Number(v)) && String(v ?? "") !== "" ? Number(v) : d);
const time = (v: FormDataEntryValue | null, d: string) => (/^\d{2}:\d{2}$/.test(String(v)) ? String(v) : d);

async function save(formData: FormData) {
  "use server";
  await requireAdmin();
  const cur = await getSettings();
  const next: Settings = {
    companyName: String(formData.get("companyName") || cur.companyName).slice(0, 80),
    interviewerName: String(formData.get("interviewerName") || cur.interviewerName).slice(0, 80),
    meetingMode: formData.get("meetingMode") === "fixed" ? "fixed" : "jitsi",
    meetingUrl: String(formData.get("meetingUrl") ?? "").trim().slice(0, 300),
    durationMinutes: Math.min(120, Math.max(15, num(formData.get("durationMinutes"), 30))),
    workingDays: DAYS.map((_, i) => i).filter((i) => formData.get(`day${i}`) === "on"),
    dayStart: time(formData.get("dayStart"), cur.dayStart),
    dayEnd: time(formData.get("dayEnd"), cur.dayEnd),
    daysAhead: Math.min(60, Math.max(1, num(formData.get("daysAhead"), 10))),
    minNoticeHours: Math.min(168, Math.max(0, num(formData.get("minNoticeHours"), 24))),
    salaryBudgetMin: Math.max(0, num(formData.get("salaryBudgetMin"))),
    salaryBudgetMax: Math.max(0, num(formData.get("salaryBudgetMax"))),
    autoInviteThreshold: Math.min(100, Math.max(0, num(formData.get("autoInviteThreshold")))),
    inviteNote: String(formData.get("inviteNote") ?? "").slice(0, 1000),
    sendRejectionEmails: formData.get("sendRejectionEmails") === "on",
  };
  await saveSettings(next);
  revalidatePath("/admin", "layout");
}

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <form action={save} className="stack" style={{ maxWidth: 760 }}>
      <h1>Settings</h1>

      <div className="card stack">
        <h2>Rating</h2>
        <p className="small muted" style={{ margin: 0 }}>Salary expectations are scored against this budget (LKR per month). Changing it re-rates every candidate.</p>
        <div className="grid2">
          <label className="field"><span className="lbl">Budget from</span><input type="number" name="salaryBudgetMin" defaultValue={s.salaryBudgetMin || ""} placeholder="e.g. 120000" /></label>
          <label className="field"><span className="lbl">Budget up to</span><input type="number" name="salaryBudgetMax" defaultValue={s.salaryBudgetMax || ""} placeholder="e.g. 180000" /></label>
        </div>
        <label className="field">
          <span className="lbl">Auto-invite threshold</span>
          <span className="help">Automatically email an interview booking link when a new applicant scores at least this and has no red flags. Leave at 0 to choose everyone yourself.</span>
          <input type="number" name="autoInviteThreshold" min={0} max={100} defaultValue={s.autoInviteThreshold} style={{ maxWidth: 140 }} />
        </label>
      </div>

      <div className="card stack">
        <h2>Interviews</h2>
        <div className="grid2">
          <label className="field"><span className="lbl">Company name (in emails)</span><input type="text" name="companyName" defaultValue={s.companyName} /></label>
          <label className="field"><span className="lbl">Interviewer (in emails)</span><input type="text" name="interviewerName" defaultValue={s.interviewerName} placeholder="e.g. Sajeev and the founders" /></label>
        </div>
        <div className="field">
          <span className="lbl">Video call</span>
          <label className="row small"><input type="radio" name="meetingMode" value="jitsi" defaultChecked={s.meetingMode === "jitsi"} /> Create a free Jitsi Meet room for each interview automatically (no account needed)</label>
          <label className="row small"><input type="radio" name="meetingMode" value="fixed" defaultChecked={s.meetingMode === "fixed"} /> Always use my own link (Google Meet, Zoom, Teams):</label>
          <input type="url" name="meetingUrl" defaultValue={s.meetingUrl} placeholder="https://meet.google.com/abc-defg-hij" style={{ marginTop: 6 }} />
        </div>
        <div className="field">
          <span className="lbl">Days you interview</span>
          <div className="pills">
            {DAYS.map((d, i) => (
              <label key={d} className="pill"><input type="checkbox" name={`day${i}`} defaultChecked={s.workingDays.includes(i)} style={{ position: "static", opacity: 1, pointerEvents: "auto", marginRight: 6 }} />{d}</label>
            ))}
          </div>
        </div>
        <div className="grid2">
          <label className="field"><span className="lbl">From (Sri Lanka time)</span><input type="time" name="dayStart" defaultValue={s.dayStart} /></label>
          <label className="field"><span className="lbl">Until</span><input type="time" name="dayEnd" defaultValue={s.dayEnd} /></label>
          <label className="field"><span className="lbl">Interview length (minutes)</span><input type="number" name="durationMinutes" defaultValue={s.durationMinutes} /></label>
          <label className="field"><span className="lbl">Show slots for the next (days)</span><input type="number" name="daysAhead" defaultValue={s.daysAhead} /></label>
          <label className="field"><span className="lbl">Minimum notice (hours)</span><input type="number" name="minNoticeHours" defaultValue={s.minNoticeHours} /></label>
        </div>
        <label className="field">
          <span className="lbl">Extra note in the invitation email (optional)</span>
          <textarea name="inviteNote" defaultValue={s.inviteNote} placeholder="e.g. Please have your latest management accounts pack to hand — we'll talk through how you put it together." />
        </label>
        <label className="row small"><input type="checkbox" name="sendRejectionEmails" defaultChecked={s.sendRejectionEmails} /> Tick &ldquo;send rejection email&rdquo; by default</label>
      </div>

      <div className="card">
        <h2>Email</h2>
        {emailConfigured() ? (
          <div className="notice ok">Sending through {process.env.SMTP_HOST} as {process.env.MAIL_FROM || process.env.SMTP_USER}.</div>
        ) : (
          <div className="notice">Not configured — emails are logged but not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM.</div>
        )}
        <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>
          Notifications for new applications and bookings go to: {process.env.ADMIN_NOTIFY_EMAIL || "nobody (set ADMIN_NOTIFY_EMAIL)"}
        </p>
      </div>

      <div><button className="btn primary" type="submit">Save settings</button></div>
    </form>
  );
}
