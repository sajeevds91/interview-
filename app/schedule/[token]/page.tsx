import { PublicHeader } from "@/components/PublicHeader";
import { findByToken, openSlots } from "@/lib/candidates";
import { getRole } from "@/lib/roles";
import { getSettings } from "@/lib/settings";
import { fmtDateTime, fmtDay, fmtTime, colomboParts } from "@/lib/time";
import { SlotPicker } from "./SlotPicker";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await findByToken(token);
  const s = await getSettings();

  if (!c || ["rejected", "hired"].includes(c.status)) {
    return (
      <>
        <PublicHeader />
        <main className="wrap narrow"><div className="card"><h2>This link is no longer active</h2><p className="muted">If you think this is a mistake, please reply to the email you received.</p></div></main>
      </>
    );
  }
  const role = getRole(c.role)!;
  const slots = await openSlots(c.id);
  const days = new Map<string, { label: string; slots: { iso: string; time: string }[] }>();
  for (const iso of slots) {
    const key = colomboParts(new Date(iso)).date;
    if (!days.has(key)) days.set(key, { label: fmtDay(iso), slots: [] });
    days.get(key)!.slots.push({ iso, time: fmtTime(iso) });
  }

  return (
    <>
      <PublicHeader />
      <main className="wrap narrow">
        <h1>Book your interview</h1>
        <p className="muted">
          Hi {c.app.name.split(" ")[0]} — choose a time for your {s.durationMinutes}-minute online interview for the {role.title} role. Times are in Sri Lanka time.
        </p>
        {c.status === "scheduled" && c.interview && (
          <div className="notice ok" style={{ marginBottom: 16 }}>
            You&apos;re booked for <b>{fmtDateTime(c.interview.start)}</b>. <a href={c.interview.meetingUrl}>Video link</a>. Pick another time below only if you need to change it.
          </div>
        )}
        <SlotPicker token={token} days={[...days.values()]} rebooking={c.status === "scheduled"} />
      </main>
    </>
  );
}
