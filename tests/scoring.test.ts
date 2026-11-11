import { test } from "node:test";
import assert from "node:assert/strict";
import { accountant } from "../lib/roles/accountant";
import type { Application, TaskAnswer } from "../lib/roles/types";
import { generateSlots } from "../lib/slots";
import { validateApplication } from "../lib/validate";

const allTasks = (v: TaskAnswer) =>
  Object.fromEntries(accountant.taskGroups.flatMap((g) => g.tasks.map((t) => [t.id, v])));

const ideal: Application = {
  name: "Nimal Perera",
  email: "nimal@example.com",
  phone: "0771234567",
  location: "Colombo 05",
  noticePeriod: "1m",
  salaryExpectation: 150000,
  salaryNegotiable: true,
  profile: {
    qualification: "cima_part",
    years: "3_5",
    current_role: "Accountant, Café Group",
    industry: ["fnb", "franchise"],
    entities: "2_3",
    intercompany: "yes",
    close_day: "6_10",
    software: ["xero"],
    coa_setup: "yes",
    excel: "advanced",
    data_entry_only: "no",
    short_stints: "0",
    role_pref: "hands_on",
    strength: "close",
    sinhala: "fluent",
    english: "strong",
    outlet_visits: "yes",
    nice_to_have: ["franchise_acct"],
    recon_explain: "Agree the ledger to the supplier statement and list reconciling items.",
  },
  tasks: allTasks("experienced"),
};
const budget = { salaryBudgetMin: 120000, salaryBudgetMax: 180000 };

test("ideal candidate scores strong with no flags", () => {
  const r = accountant.score(ideal, budget);
  assert.equal(r.band, "strong");
  assert.ok(r.total >= 90, `total ${r.total}`);
  assert.deepEqual(r.flags, []);
});

test("red flags from the brief are raised", () => {
  const r = accountant.score(
    {
      ...ideal,
      salaryExpectation: 300000,
      profile: {
        ...ideal.profile,
        qualification: "fully_qualified",
        close_day: "unsure",
        software: ["tally"],
        role_pref: "supervise",
        strength: "tax",
        short_stints: "2plus",
        data_entry_only: "yes",
      },
    },
    budget,
  );
  const joined = r.flags.join(" | ");
  for (const s of ["Fully qualified", "Vague on close dates", "desktop", "supervise", "tax planning", "under a year", "data entry", "above budget"]) {
    assert.ok(joined.includes(s), `missing flag: ${s} in ${joined}`);
  }
});

test("'can do' scores less than 'done it', 'can't' scores zero for tasks", () => {
  const line = (v: TaskAnswer) => accountant.score({ ...ideal, tasks: allTasks(v) }, budget).lines.find((l) => l.label.includes("task"))!;
  assert.equal(line("experienced").points, 30);
  assert.equal(line("can_do").points, 15);
  assert.equal(line("cannot").points, 0);
  assert.ok(accountant.score({ ...ideal, tasks: allTasks("cannot") }, budget).flags.some((f) => f.includes("core tasks")));
});

test("validation rejects missing fields and accepts a full application", () => {
  assert.ok(Object.keys(validateApplication(accountant, {}).errors).length > 10);
  const ok = validateApplication(accountant, { ...ideal, salaryExpectation: "150,000", salaryNegotiable: "yes" });
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.app!.salaryExpectation, 150000);
});

test("slots respect working hours in Sri Lanka time and skip booked ones", () => {
  const cfg = { durationMinutes: 30, workingDays: [1, 2, 3, 4, 5], dayStart: "10:00", dayEnd: "12:00", daysAhead: 7, minNoticeHours: 0 };
  const now = new Date("2026-11-09T00:00:00Z"); // Monday 05:30 in Colombo
  const slots = generateSlots(cfg, ["2026-11-09T04:30:00.000Z"], now);
  assert.equal(slots[0], "2026-11-09T05:00:00.000Z"); // 10:30 Colombo (10:00 is booked)
  assert.equal(slots.filter((s) => s.startsWith("2026-11-09")).length, 3);
  assert.ok(!slots.some((s) => s.startsWith("2026-11-14") || s.startsWith("2026-11-15")), "no weekend slots");
});
