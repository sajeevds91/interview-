import Link from "next/link";
import { notFound } from "next/navigation";
import { Score, StatusBadge, lkr } from "@/components/ui";
import { getCandidate, STATUSES } from "@/lib/candidates";
import { emailsFor } from "@/lib/email";
import { getRole } from "@/lib/roles";
import { TASK_ANSWERS, noticeLabel, type Question } from "@/lib/roles/types";
import { getSettings } from "@/lib/settings";
import { fmtDateTime } from "@/lib/time";
import { cancelInterviewAction, deleteAction, inviteAction, rejectAction, saveReviewAction } from "./actions";
import { StatusSelect } from "./StatusSelect";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

function answerLabel(q: Question, v: string | string[] | undefined) {
  if (v === undefined || (Array.isArray(v) && !v.length)) return "—";
  if (q.type === "yesno") return v === "yes" ? "Yes" : "No";
  const list = Array.isArray(v) ? v : [v];
  return list.map((x) => q.options?.find((o) => o.value === x)?.label ?? x).join(", ");
}

const BAND_TEXT = { strong: "Strong fit", possible: "Possible fit", weak: "Weak fit" };

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getCandidate(id);
  if (!c) notFound();
  const role = getRole(c.role)!;
  const [emails, settings] = await Promise.all([emailsFor(c.id), getSettings()]);
  const a = c.app;
  const closed = ["rejected", "hired"].includes(c.status);

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <Link href="/admin" className="small">← All candidates</Link>
      </div>
      <div className="row" style={{ marginBottom: 18, alignItems: "flex-start" }}>
        <Score s={c.score} big />
        <div>
          <h1 style={{ marginBottom: 4 }}>{a.name}</h1>
          <div className="row small muted" style={{ gap: 8 }}>
            <span>{role.title}</span>·<span>{BAND_TEXT[c.score.band]}</span>·<StatusBadge status={c.status} />
            <span>· Applied {fmtDateTime(c.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="layout-2">
        <div className="stack" style={{ minWidth: 0 }}>
          <div className="card">
            <h2>Contact</h2>
            <dl className="kv">
              <dt>Email</dt><dd><a href={`mailto:${a.email}`}>{a.email}</a></dd>
              <dt>Phone</dt><dd><a href={`tel:${a.phone.replace(/\s/g, "")}`}>{a.phone}</a> · <a href={`https://wa.me/${a.phone.replace(/\D/g, "").replace(/^0/, "94")}`} target="_blank" rel="noreferrer">WhatsApp</a></dd>
              <dt>Based in</dt><dd>{a.location}</dd>
              {a.linkedin && <><dt>LinkedIn</dt><dd><a href={a.linkedin} target="_blank" rel="noreferrer">{a.linkedin}</a></dd></>}
              {a.cvLink && <><dt>CV</dt><dd><a href={a.cvLink} target="_blank" rel="noreferrer">Open CV ↗</a></dd></>}
              <dt>Notice period</dt><dd>{noticeLabel(a.noticePeriod)}{a.earliestStart ? ` · earliest ${a.earliestStart}` : ""}</dd>
              <dt>Salary expectation</dt><dd>{lkr(a.salaryExpectation)} / month{a.salaryNegotiable ? " · negotiable" : ""}</dd>
            </dl>
          </div>

          <div className="card">
            <h2>Rating breakdown</h2>
            {(c.score.flags.length > 0 || c.score.strengths.length > 0) && (
              <div className="grid2" style={{ marginBottom: 16 }}>
                <div>
                  <h3>Red flags</h3>
                  {c.score.flags.length ? c.score.flags.map((f) => <div className="flag" key={f}>{f}</div>) : <div className="small muted">None</div>}
                </div>
                <div>
                  <h3>Strengths</h3>
                  {c.score.strengths.length ? c.score.strengths.map((f) => <div className="flag plus" key={f}>{f}</div>) : <div className="small muted">—</div>}
                </div>
              </div>
            )}
            <div className="stack" style={{ gap: 10 }}>
              {c.score.lines.map((l) => (
                <div key={l.label}>
                  <div className="row small" style={{ gap: 8 }}>
                    <b>{l.label}</b>
                    <span className="muted">{l.note}</span>
                    <span className="spacer" />
                    <span className="num">{l.max ? `${Math.round(l.points * 10) / 10} / ${l.max}` : `+${l.points}`}</span>
                  </div>
                  {l.max > 0 && <div className="bar" style={{ marginTop: 4 }}><i style={{ width: `${(l.points / l.max) * 100}%` }} /></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Qualifications & experience</h2>
            {role.profileSections.map((s) => (
              <div key={s.title} style={{ marginBottom: 14 }}>
                <h3 className="muted" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.title}</h3>
                <dl className="kv">
                  {s.questions.map((q) => (
                    <div key={q.id} style={{ display: "contents" }}>
                      <dt>{q.label}</dt>
                      <dd style={{ whiteSpace: "pre-wrap" }}>{answerLabel(q, a.profile[q.id])}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Divide task checklist</h2>
            <div className="legend">
              {TASK_ANSWERS.map((t) => (
                <span key={t.value}>
                  <span className={`badge ${t.value === "experienced" ? "good" : t.value === "can_do" ? "warn" : "bad"}`}>{t.short}</span>{" "}
                  {Object.values(a.tasks).filter((v) => v === t.value).length}
                </span>
              ))}
            </div>
            {role.taskGroups.map((g) => (
              <div className="task-group" key={g.id}>
                <h3>{g.title}</h3>
                {g.tasks.map((t) => {
                  const v = a.tasks[t.id];
                  const ans = TASK_ANSWERS.find((x) => x.value === v);
                  return (
                    <div className="task-row" key={t.id}>
                      <div className="t small">{t.label}{t.weight === 3 && <span className="tiny"> · core</span>}</div>
                      <span className={`badge ${v === "experienced" ? "good" : v === "can_do" ? "warn" : "bad"}`}>{ans?.short ?? "—"}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Next step</h2>
            {c.interview && c.status === "scheduled" ? (
              <>
                <div className="notice ok">Interview booked for <b>{fmtDateTime(c.interview.start)}</b></div>
                <a className="btn primary" href={c.interview.meetingUrl} target="_blank" rel="noreferrer">Join video call ↗</a>
                <form action={cancelInterviewAction.bind(null, c.id)}>
                  <button className="btn sm" type="submit">Cancel &amp; ask to rebook</button>
                </form>
              </>
            ) : c.status === "invited" ? (
              <>
                <div className="notice">Booking link sent {c.invitedAt ? fmtDateTime(c.invitedAt) : ""}. Waiting for the candidate to pick a time.</div>
                <form action={inviteAction.bind(null, c.id)}><button className="btn sm" type="submit">Resend invitation</button></form>
              </>
            ) : !closed ? (
              <>
                <p className="small muted" style={{ margin: 0 }}>
                  Selecting emails {a.name.split(" ")[0]} a link to book a {settings.durationMinutes}-minute online interview from your available times. They get a calendar invite and video link automatically.
                </p>
                <form action={inviteAction.bind(null, c.id)}>
                  <button className="btn primary" type="submit" style={{ width: "100%" }}>Select &amp; invite to interview</button>
                </form>
              </>
            ) : null}
            {c.schedulingToken && !closed && (
              <div className="tiny">Booking link: <code style={{ wordBreak: "break-all" }}>{(process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "")}/schedule/{c.schedulingToken}</code></div>
            )}
            {c.status !== "rejected" && (
              <details>
                <summary className="small">Not progressing</summary>
                <form action={rejectAction.bind(null, c.id)} className="stack" style={{ marginTop: 10 }}>
                  <label className="row small"><input type="checkbox" name="notify" defaultChecked={settings.sendRejectionEmails} /> Send a polite rejection email</label>
                  <button className="btn danger sm" type="submit">Mark as not progressing</button>
                </form>
              </details>
            )}
          </div>

          <form className="card stack" action={saveReviewAction.bind(null, c.id)}>
            <h2 style={{ margin: 0 }}>Your review</h2>
            <label className="field">
              <span className="lbl">Status</span>
              <StatusSelect defaultValue={c.status} options={STATUSES} />
            </label>
            <label className="field">
              <span className="lbl">Your rating (after CV / interview)</span>
              <select name="rating" defaultValue={c.manualRating ?? ""}>
                <option value="">Not rated</option>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} {n}/5</option>)}
              </select>
            </label>
            <label className="field">
              <span className="lbl">Notes</span>
              <textarea name="notes" defaultValue={c.notes} placeholder="Interview notes, references, follow-ups…" />
            </label>
            <button className="btn" type="submit">Save</button>
          </form>

          <div className="card">
            <h3>Emails</h3>
            {emails.length === 0 && <div className="small muted">None yet</div>}
            {emails.map((e) => (
              <details key={e.id} style={{ padding: "6px 0", borderTop: "1px solid var(--line)" }}>
                <summary className="small" style={{ fontWeight: 500 }}>
                  <span className={`badge ${e.status === "sent" ? "good" : e.status === "failed" ? "bad" : "warn"}`}>{e.status === "not_sent" ? "logged" : e.status}</span>{" "}
                  {e.subject}
                </summary>
                <div className="tiny" style={{ margin: "6px 0" }}>To {e.to} · {fmtDateTime(e.at)}{e.error ? ` · ${e.error}` : ""}</div>
                <pre className="small" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", background: "var(--surface-2)", padding: 10, borderRadius: 8, margin: 0 }}>{e.text}</pre>
              </details>
            ))}
          </div>

          <div className="card">
            <h3>History</h3>
            <ul className="timeline">
              {[...c.history].reverse().map((h, i) => (
                <li key={i}><span className="tiny">{fmtDateTime(h.at)}</span><br />{h.text}</li>
              ))}
            </ul>
          </div>

          <form action={deleteAction.bind(null, c.id)}>
            <ConfirmSubmit className="btn danger sm" message="Delete this candidate and their application? This cannot be undone.">Delete candidate permanently</ConfirmSubmit>
          </form>
        </div>
      </div>
    </>
  );
}
