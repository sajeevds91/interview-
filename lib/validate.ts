import { NOTICE_OPTIONS, type Application, type Role, type TaskAnswer } from "./roles/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TASK_VALUES: TaskAnswer[] = ["experienced", "can_do", "cannot"];

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Validates and normalises a raw submission. Returns field-keyed errors. */
export function validateApplication(role: Role, raw: any): { app?: Application; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = str(raw?.name, 120);
  const email = str(raw?.email, 200).toLowerCase();
  const phone = str(raw?.phone, 40);
  const location = str(raw?.location, 120);
  if (name.length < 2) errors.name = "Please enter your full name";
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address";
  if (phone.replace(/\D/g, "").length < 9) errors.phone = "Please enter a valid phone number";
  if (!location) errors.location = "Please tell us where you're based";

  const noticePeriod = str(raw?.noticePeriod, 20);
  if (!NOTICE_OPTIONS.some((o) => o.value === noticePeriod)) errors.noticePeriod = "Please choose your notice period";
  const salaryExpectation = Math.round(Number(String(raw?.salaryExpectation ?? "").replace(/[^\d.]/g, "")));
  if (!salaryExpectation || salaryExpectation < 1000) errors.salaryExpectation = "Please enter your expected monthly salary in LKR";

  const profile: Record<string, string | string[]> = {};
  for (const section of role.profileSections) {
    for (const q of section.questions) {
      const v = raw?.profile?.[q.id];
      if (q.type === "multi") {
        const allowed = new Set(q.options?.map((o) => o.value));
        const list = Array.isArray(v) ? v.filter((x) => allowed.has(x)) : [];
        if (q.required && !list.length) errors[`profile.${q.id}`] = "Please choose at least one";
        profile[q.id] = list;
      } else if (q.type === "select" || q.type === "yesno") {
        const allowed = q.type === "yesno" ? ["yes", "no"] : q.options!.map((o) => o.value);
        const s = str(v, 50);
        if (s && !allowed.includes(s)) errors[`profile.${q.id}`] = "Invalid choice";
        else if (q.required && !s) errors[`profile.${q.id}`] = "Please choose an option";
        if (s) profile[q.id] = s;
      } else {
        const s = str(v, q.maxLength ?? 500);
        if (q.required && s.length < 3) errors[`profile.${q.id}`] = "Please answer this question";
        if (s) profile[q.id] = s;
      }
    }
  }

  const tasks: Record<string, TaskAnswer> = {};
  for (const g of role.taskGroups) {
    for (const t of g.tasks) {
      const v = raw?.tasks?.[t.id];
      if (!TASK_VALUES.includes(v)) errors[`tasks.${t.id}`] = "Please pick one";
      else tasks[t.id] = v;
    }
  }

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    app: {
      name,
      email,
      phone,
      location,
      linkedin: str(raw?.linkedin, 300) || undefined,
      cvLink: str(raw?.cvLink, 500) || undefined,
      noticePeriod,
      earliestStart: str(raw?.earliestStart, 20) || undefined,
      salaryExpectation,
      salaryNegotiable: raw?.salaryNegotiable === true || raw?.salaryNegotiable === "yes",
      profile,
      tasks,
    },
  };
}
