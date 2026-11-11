"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookAction } from "./actions";

type Day = { label: string; slots: { iso: string; time: string }[] };

export function SlotPicker({ token, days, rebooking }: { token: string; days: Day[]; rebooking: boolean }) {
  const [sel, setSel] = useState<{ iso: string; label: string } | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (done) {
    return (
      <div className="card">
        <h2>You&apos;re booked ✓</h2>
        <p>{sel?.label}. We&apos;ve emailed you a calendar invite with the video call link.</p>
      </div>
    );
  }
  if (!days.length) {
    return <div className="card"><p className="muted" style={{ margin: 0 }}>There are no open times right now. Please reply to the invitation email and we&apos;ll find a time with you.</p></div>;
  }

  return (
    <div className="card">
      <div className="stack">
        {days.map((d) => (
          <div key={d.label}>
            <h3>{d.label}</h3>
            <div className="slots">
              {d.slots.map((s) => (
                <button key={s.iso} type="button" className={sel?.iso === s.iso ? "on" : ""} onClick={() => { setSel({ iso: s.iso, label: `${d.label} at ${s.time}` }); setError(""); }}>
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "sticky", bottom: 0, background: "var(--surface)", paddingTop: 16, marginTop: 16, borderTop: "1px solid var(--line)" }}>
        {error && <div className="notice" style={{ marginBottom: 10 }}>{error}</div>}
        <div className="row">
          <span className="small">{sel ? <b>{sel.label}</b> : <span className="muted">Choose a time above</span>}</span>
          <span className="spacer" />
          <button
            className="btn primary"
            disabled={!sel || pending}
            onClick={() =>
              start(async () => {
                const r = await bookAction(token, sel!.iso);
                if (r.ok) setDone(true);
                else { setError(r.error); setSel(null); router.refresh(); }
              })
            }
          >
            {pending ? "Booking…" : rebooking ? "Move my interview" : "Confirm this time"}
          </button>
        </div>
      </div>
    </div>
  );
}
