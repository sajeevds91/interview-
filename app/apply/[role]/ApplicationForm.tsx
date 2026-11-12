"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TASK_ANSWERS, type Option, type Question, type Role, type TaskAnswer } from "@/lib/roles/types";
import { submitApplication } from "./actions";

type ClientRole = Omit<Role, "score">;
type Form = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  cvLink: string;
  noticePeriod: string;
  earliestStart: string;
  salaryExpectation: string;
  salaryNegotiable: "yes" | "no" | "";
  website: string; // honeypot
  profile: Record<string, string | string[]>;
  tasks: Record<string, TaskAnswer>;
};

const EMPTY: Form = {
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  cvLink: "",
  noticePeriod: "",
  earliestStart: "",
  salaryExpectation: "",
  salaryNegotiable: "",
  website: "",
  profile: {},
  tasks: {},
};

export function ApplicationForm({ role, noticeOptions }: { role: ClientRole; noticeOptions: Option[] }) {
  const router = useRouter();
  const draftKey = `divide-apply-${role.slug}`;
  const [f, setF] = useState<Form>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const steps = useMemo(
    () => ["About you", ...role.profileSections.map((s) => s.title), "The work at Divide", "Availability & salary"],
    [role],
  );
  const taskStep = 1 + role.profileSections.length;
  const lastStep = steps.length - 1;

  // Restore / persist an unsent draft in this browser only.
  useEffect(() => {
    try {
      const d = localStorage.getItem(draftKey);
      if (d) setF({ ...EMPTY, ...JSON.parse(d) });
    } catch {}
  }, [draftKey]);
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(f));
    } catch {}
  }, [f, draftKey]);

  const set = (k: keyof Form, v: any) => setF((p) => ({ ...p, [k]: v }));
  const setP = (k: string, v: string | string[]) => setF((p) => ({ ...p, profile: { ...p.profile, [k]: v } }));
  const setT = (k: string, v: TaskAnswer) => setF((p) => ({ ...p, tasks: { ...p.tasks, [k]: v } }));

  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (f.name.trim().length < 2) e.name = "Please enter your full name";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Please enter a valid email address";
      if (f.phone.replace(/\D/g, "").length < 9) e.phone = "Please enter a valid phone number";
      if (!f.location.trim()) e.location = "Please tell us where you're based";
    } else if (s >= 1 && s < taskStep) {
      for (const q of role.profileSections[s - 1].questions) {
        if (!q.required) continue;
        const v = f.profile[q.id];
        const empty = Array.isArray(v) ? v.length === 0 : !v || String(v).trim().length < (q.type === "textarea" ? 3 : 1);
        if (empty) e[`profile.${q.id}`] = q.type === "multi" ? "Please choose at least one" : "Please answer this question";
      }
    } else if (s === taskStep) {
      for (const g of role.taskGroups) for (const t of g.tasks) if (!f.tasks[t.id]) e[`tasks.${t.id}`] = "Please pick one";
    } else if (s === lastStep) {
      if (!f.noticePeriod) e.noticePeriod = "Please choose your notice period";
      if (!Number(f.salaryExpectation.replace(/[^\d.]/g, ""))) e.salaryExpectation = "Please enter an amount";
    }
    return e;
  }

  function stepOfError(key: string) {
    if (key.startsWith("tasks.")) return taskStep;
    if (key.startsWith("profile.")) {
      const id = key.slice(8);
      return 1 + role.profileSections.findIndex((s) => s.questions.some((q) => q.id === id));
    }
    return ["noticePeriod", "salaryExpectation"].includes(key) ? lastStep : 0;
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector(".has-err, .task-row.missing")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    const e = validateStep(lastStep);
    setErrors(e);
    if (Object.keys(e).length) return;
    start(async () => {
      const res = await submitApplication(role.slug, f);
      if (res.ok) {
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        router.push(`/apply/${role.slug}/thanks`);
      } else {
        setErrors(res.errors);
        const first = Object.keys(res.errors).find((k) => k !== "form");
        if (first) setStep(stepOfError(first));
      }
    });
  }

  const answered = Object.keys(f.tasks).length;
  const totalTasks = role.taskGroups.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div className="card">
      <div className="step-label">Step {step + 1} of {steps.length} · {steps[step]}</div>
      <div className="steps" aria-hidden>
        {steps.map((s, i) => <div key={s} className={`s ${i <= step ? "on" : ""}`} />)}
      </div>

      {step === 0 && (
        <div className="stack">
          <h2>About you</h2>
          <Text label="Full name" k="name" f={f} set={set} errors={errors} autoComplete="name" />
          <div className="grid2">
            <Text label="Email" k="email" type="email" f={f} set={set} errors={errors} autoComplete="email" />
            <Text label="Phone number" k="phone" type="tel" f={f} set={set} errors={errors} autoComplete="tel" placeholder="07X XXX XXXX" />
          </div>
          <Text label="Where are you based?" k="location" f={f} set={set} errors={errors} placeholder="e.g. Nugegoda, Colombo" />
          <div className="grid2">
            <Text label="LinkedIn (optional)" k="linkedin" type="url" f={f} set={set} errors={errors} />
            <Text label="Link to your CV (optional)" k="cvLink" type="url" f={f} set={set} errors={errors} help="Google Drive / Dropbox link" />
          </div>
          <div className="hp" aria-hidden>
            <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
          </div>
        </div>
      )}

      {step >= 1 && step < taskStep && (() => {
        const section = role.profileSections[step - 1];
        return (
          <div className="stack">
            <div>
              <h2>{section.title}</h2>
              {section.description && <p className="muted small">{section.description}</p>}
            </div>
            {section.questions.map((q) => (
              <QuestionField key={q.id} q={q} value={f.profile[q.id]} onChange={(v) => setP(q.id, v)} error={errors[`profile.${q.id}`]} />
            ))}
          </div>
        );
      })()}

      {step === taskStep && (
        <div>
          <h2>The work at Divide</h2>
          <p className="muted small">
            For each task, tell us honestly where you are. &ldquo;Can do&rdquo; is a perfectly good answer — we&apos;d rather know.
          </p>
          <div className="legend">
            {TASK_ANSWERS.map((a) => <span key={a.value}><b>{a.short}</b> — {a.label.toLowerCase()}</span>)}
          </div>
          <div className="row small muted" style={{ marginBottom: 8 }}>
            <span>{answered} of {totalTasks} answered</span>
          </div>
          {role.taskGroups.map((g) => (
            <div className="task-group" key={g.id}>
              <h3 style={{ marginBottom: 2 }}>{g.title}</h3>
              {g.description && <div className="tiny">{g.description}</div>}
              {g.tasks.map((t) => (
                <div key={t.id} className={`task-row ${errors[`tasks.${t.id}`] && !f.tasks[t.id] ? "missing" : ""}`}>
                  <div className="t">{t.label}</div>
                  <div className="seg" role="radiogroup" aria-label={t.label}>
                    {TASK_ANSWERS.map((a) => (
                      <label key={a.value} className={`v-${a.value} ${f.tasks[t.id] === a.value ? "on" : ""}`}>
                        <input type="radio" name={t.id} value={a.value} checked={f.tasks[t.id] === a.value} onChange={() => setT(t.id, a.value)} />
                        {a.short}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {step === lastStep && (
        <div className="stack">
          <h2>Availability & salary</h2>
          <div className={`field ${errors.noticePeriod ? "has-err" : ""}`}>
            <span className="lbl" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Notice period / when can you start?</span>
            <Pills options={noticeOptions} value={f.noticePeriod} onChange={(v) => set("noticePeriod", v)} />
            {errors.noticePeriod && <div className="err">{errors.noticePeriod}</div>}
          </div>
          {f.noticePeriod && f.noticePeriod !== "immediate" && (
            <Text label="Earliest start date (optional)" k="earliestStart" type="date" f={f} set={set} errors={errors} />
          )}
          <div className="grid2">
            <Text label="Expected monthly salary (LKR, gross)" k="salaryExpectation" f={f} set={set} errors={errors} placeholder="e.g. 85,000" inputMode="numeric" />
            <div className="field">
              <span className="lbl" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Is this negotiable?</span>
              <Pills options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} value={f.salaryNegotiable} onChange={(v) => set("salaryNegotiable", v)} />
            </div>
          </div>
          <p className="tiny">By submitting you agree that Divide may store your details to assess your application and contact you about it.</p>
        </div>
      )}

      {errors.form && <div className="notice" style={{ marginTop: 16 }}>{errors.form}</div>}

      <div className="row" style={{ marginTop: 26 }}>
        {step > 0 && <button type="button" className="btn" onClick={() => { setErrors({}); setStep((s) => s - 1); }}>Back</button>}
        <span className="spacer" />
        {step < lastStep ? (
          <button type="button" className="btn primary" onClick={next}>Continue</button>
        ) : (
          <button type="button" className="btn primary" onClick={submit} disabled={pending}>{pending ? "Submitting…" : "Submit application"}</button>
        )}
      </div>
    </div>
  );
}

function Text(props: {
  label: string;
  k: keyof Form;
  f: Form;
  set: (k: keyof Form, v: string) => void;
  errors: Record<string, string>;
  type?: string;
  help?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric";
}) {
  const err = props.errors[props.k as string];
  return (
    <label className={`field ${err ? "has-err" : ""}`}>
      <span className="lbl">{props.label}</span>
      {props.help && <span className="help">{props.help}</span>}
      <input
        type={props.type ?? "text"}
        value={props.f[props.k] as string}
        onChange={(e) => props.set(props.k, e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
      />
      {err && <div className="err">{err}</div>}
    </label>
  );
}

function Pills({ options, value, onChange, multi }: { options: Option[]; value: string | string[] | undefined; onChange: (v: any) => void; multi?: boolean }) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div className="pills">
      {options.map((o) => {
        const on = list.includes(o.value);
        return (
          <label key={o.value} className={`pill ${on ? "on" : ""}`}>
            <input
              type={multi ? "checkbox" : "radio"}
              checked={on}
              onChange={() => onChange(multi ? (on ? list.filter((x) => x !== o.value) : [...list, o.value]) : o.value)}
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

function QuestionField({ q, value, onChange, error }: { q: Question; value: any; onChange: (v: any) => void; error?: string }) {
  return (
    <div className={`field ${error ? "has-err" : ""}`}>
      <span className="lbl" style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>{q.label}</span>
      {q.help && <span className="help">{q.help}</span>}
      {q.type === "select" && (q.options!.length > 5 ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {q.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <Pills options={q.options!} value={value} onChange={onChange} />
      ))}
      {q.type === "yesno" && <Pills options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} value={value} onChange={onChange} />}
      {q.type === "multi" && <Pills multi options={q.options!} value={value} onChange={onChange} />}
      {q.type === "text" && <input type="text" value={value ?? ""} maxLength={q.maxLength} placeholder={q.placeholder} onChange={(e) => onChange(e.target.value)} />}
      {q.type === "textarea" && (
        <>
          <textarea value={value ?? ""} maxLength={q.maxLength} onChange={(e) => onChange(e.target.value)} />
          {q.maxLength && <div className="tiny" style={{ textAlign: "right" }}>{(value ?? "").length}/{q.maxLength}</div>}
        </>
      )}
      {error && <div className="err">{error}</div>}
    </div>
  );
}
