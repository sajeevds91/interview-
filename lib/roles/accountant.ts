import {
  NOTICE_OPTIONS,
  type Application,
  type Role,
  type ScoreLine,
  type ScoreResult,
  type ScoreSettings,
  type TaskAnswer,
  type TaskGroup,
} from "./types";

/* ------------------------------------------------------------------ */
/* Tasks the accountant does at Divide                                 */
/* weight: 3 = core to the role, 2 = important, 1 = normal             */
/* ------------------------------------------------------------------ */

const taskGroups: TaskGroup[] = [
  {
    id: "daily",
    title: "Daily",
    tasks: [
      { id: "d_pos_recon", label: "Reconcile POS sales with cash, card payments and Uber", weight: 3 },
      { id: "d_discounts", label: "Check discounts, refunds, voids and other free items", weight: 2 },
      { id: "d_petty_cash", label: "Count the petty cash and check it against receipts", weight: 2 },
      { id: "d_supplier_inv", label: "Check that supplier invoices match deliveries", weight: 2 },
      { id: "d_inventory", label: "Quick inventory check on consumption to plan the next order", weight: 1 },
      { id: "d_wastage", label: "Record wastage and spoilage", weight: 1 },
      { id: "d_franchise_inv", label: "Check items sent to franchisees and send invoices for them", weight: 2 },
    ],
  },
  {
    id: "weekly",
    title: "Weekly",
    tasks: [
      { id: "w_bank_recon", label: "Reconcile bank transactions and card settlements", weight: 3 },
      { id: "w_uber", label: "Check Uber commissions and outstanding settlements", weight: 2 },
      { id: "w_supplier_bal", label: "Update supplier balances and prepare upcoming payments", weight: 2 },
      { id: "w_stock_review", label: "Review stock counts, purchases and ingredient usage", weight: 2 },
      { id: "w_recipe_cost", label: "Compare actual costs with recipe costs", weight: 2 },
      {
        id: "w_sales_labour",
        label: "Review total sales and barista salary costs against hours worked (salary, OT, incentives) and cash for upcoming bills",
        weight: 2,
      },
      { id: "w_franchise_recon", label: "Reconcile franchise outlet sales against consumption and available stock", weight: 2 },
    ],
  },
  {
    id: "monthly",
    title: "Monthly",
    tasks: [
      {
        id: "m_sales_settle",
        label: "Reconcile sales and settlements: match POS sales to cash deposits, card settlements and Uber payouts; verify commissions, refunds and discounts; follow up outstanding amounts",
        weight: 3,
      },
      {
        id: "m_supplier_close",
        label: "Close supplier accounts: match statements to invoices, payments and credit notes; confirm balances; prepare next month's payment schedule",
        weight: 3,
      },
      {
        id: "m_stock_count",
        label: "Month-end stock count by outlet and investigate differences (purchases, transfers, wastage, staff consumption)",
        weight: 3,
      },
      {
        id: "m_fb_cost",
        label: "Review food & beverage costs vs recipe costs, find the biggest variances and update recipe costs when supplier prices change",
        weight: 2,
      },
      {
        id: "m_payroll",
        label: "Finalise payroll: verify hours, basic pay, OT and incentives against attendance; review staff cost as % of sales by outlet",
        weight: 3,
      },
      {
        id: "m_franchise_review",
        label: "Review each franchise outlet: reported sales vs expected consumption, reconcile franchise fees and stock invoices, chase overdue balances",
        weight: 2,
      },
      {
        id: "m_pnl",
        label: "Prepare a P&L summary by outlet and compare sales, gross margin and operating profit to budget and last month",
        weight: 3,
      },
      {
        id: "m_cashflow",
        label: "Plan next month's cash flow (collections less payroll, suppliers, rent, utilities, bills) and flag any shortfall",
        weight: 2,
      },
      { id: "m_followups", label: "Record unresolved differences and overdue payments with an owner and due date", weight: 1 },
    ],
  },
  {
    id: "technical",
    title: "Technical & statutory",
    description: "Wider responsibilities across all Divide entities.",
    tasks: [
      {
        id: "t_multi_entity",
        label: "Close monthly books for more than one company at the same time, including inter-company balances",
        weight: 3,
      },
      {
        id: "t_mgmt_accounts",
        label: "Deliver management accounts by working day 10 (P&L per outlet and entity, balance sheet, cash position)",
        weight: 3,
      },
      { id: "t_statutory_payroll", label: "Payroll statutory: EPF, ETF and APIT", weight: 3 },
      {
        id: "t_tax_schedules",
        label: "Prepare income tax instalment, WHT, VAT and SSCL schedules for the tax consultant",
        weight: 2,
      },
      {
        id: "t_royalty",
        label: "Invoice franchise royalty, management and marketing fees at agreement- and channel-specific rates",
        weight: 2,
      },
      { id: "t_landed_cost", label: "Calculate landed cost on imports, including clearing charges", weight: 1 },
      { id: "t_stock_valuation", label: "Monthly stock valuation (beans, matcha, cups) per outlet and cost per cup", weight: 2 },
      { id: "t_coa", label: "Set up a chart of accounts in a cloud accounting package", weight: 2 },
      {
        id: "t_excel_recon",
        label: "Build reconciliations in Excel / Google Sheets from raw POS, bank and scheduler exports (pivots, lookups)",
        weight: 3,
      },
      {
        id: "t_audit_trail",
        label: "Keep schedules and document files an auditor or bank can pick up without a clean-up",
        weight: 2,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Short qualification & experience questions                          */
/* ------------------------------------------------------------------ */

const QUALIFICATIONS = [
  { value: "ca_part", label: "CA Sri Lanka — part-qualified", points: 12 },
  { value: "cima_part", label: "CIMA — part-qualified", points: 12 },
  { value: "acca_part", label: "ACCA — part-qualified", points: 10 },
  { value: "aat_finalist", label: "AAT — passed finalist", points: 9 },
  { value: "fully_qualified", label: "Fully qualified (CA / CIMA / ACCA)", points: 7 },
  { value: "aat_progress", label: "AAT — in progress", points: 3 },
  { value: "degree", label: "Accounting / finance degree only", points: 4 },
  { value: "none", label: "Other / none", points: 0 },
];

const YEARS = [
  { value: "lt1", label: "Less than 1 year", points: 0 },
  { value: "1_2", label: "1–2 years", points: 5 },
  { value: "3_5", label: "3–5 years", points: 13 },
  { value: "6_8", label: "6–8 years", points: 11 },
  { value: "8plus", label: "More than 8 years", points: 8 },
];

const ENTITIES = [
  { value: "0", label: "None — I haven't owned a month-end close", points: 0 },
  { value: "1", label: "1 company", points: 3 },
  { value: "2_3", label: "2–3 companies", points: 7 },
  { value: "4plus", label: "4 or more companies", points: 8 },
];

const CLOSE_DAY = [
  { value: "le5", label: "Within 5 working days", points: 5 },
  { value: "6_10", label: "Working day 6–10", points: 5 },
  { value: "11_15", label: "Working day 11–15", points: 3 },
  { value: "gt15", label: "Later than that", points: 0 },
  { value: "unsure", label: "Not sure / there was no fixed date", points: 0 },
];

const INDUSTRIES = [
  { value: "fnb", label: "Food & beverage / cafés / restaurants" },
  { value: "retail", label: "Retail" },
  { value: "multi_outlet", label: "Other multi-outlet business" },
  { value: "sme_firm", label: "Accounting firm serving SMEs" },
  { value: "franchise", label: "Franchise business" },
  { value: "manufacturing", label: "Manufacturing / distribution" },
  { value: "other", label: "Other" },
];
const RELEVANT_INDUSTRIES = ["fnb", "retail", "multi_outlet", "sme_firm", "franchise"];

const SOFTWARE = [
  { value: "xero", label: "Xero" },
  { value: "qbo", label: "QuickBooks Online" },
  { value: "zoho", label: "Zoho Books" },
  { value: "odoo", label: "Odoo" },
  { value: "netsuite", label: "NetSuite" },
  { value: "sap_b1", label: "SAP Business One" },
  { value: "sage_cloud", label: "Sage Business Cloud" },
  { value: "qb_desktop", label: "QuickBooks Desktop" },
  { value: "tally", label: "Tally" },
  { value: "sage50", label: "Sage 50 / Peachtree" },
  { value: "other", label: "Other" },
];
const CLOUD = ["xero", "qbo", "zoho", "odoo", "netsuite", "sage_cloud", "sap_b1"];

const NICE_TO_HAVE = [
  { value: "franchise_acct", label: "Franchise or royalty accounting" },
  { value: "vat_reg", label: "Took a company through VAT registration and its first year" },
  { value: "consolidation", label: "Group consolidation across related companies" },
  { value: "lender_packs", label: "Prepared lender packs / bank-loan reporting" },
  { value: "migration", label: "Finance user in an ERP or POS migration" },
];

function pts<T extends { value: string; points: number }>(list: T[], v: unknown) {
  return list.find((o) => o.value === v)?.points ?? 0;
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v : typeof v === "string" && v ? [v] : [];
}

const TASK_VALUE: Record<TaskAnswer, number> = { experienced: 1, can_do: 0.5, cannot: 0 };

export function scoreTasks(groups: TaskGroup[], answers: Record<string, TaskAnswer>) {
  let got = 0;
  let max = 0;
  let coreCannot = 0;
  let experienced = 0;
  let total = 0;
  for (const g of groups) {
    for (const t of g.tasks) {
      const a = answers[t.id] ?? "cannot";
      max += t.weight;
      got += t.weight * TASK_VALUE[a];
      total++;
      if (a === "experienced") experienced++;
      if (a === "cannot" && t.weight === 3) coreCannot++;
    }
  }
  return { ratio: max ? got / max : 0, coreCannot, experienced, total };
}

export function scoreSalary(app: Application, s: ScoreSettings) {
  const ask = app.salaryExpectation;
  if (!s.salaryBudgetMax || !ask) return { points: 5, note: "No budget set" };
  if (ask <= s.salaryBudgetMax) return { points: 5, note: "Within budget" };
  const over = (ask - s.salaryBudgetMax) / s.salaryBudgetMax;
  if (over <= 0.15) return { points: app.salaryNegotiable ? 3 : 2, note: `${Math.round(over * 100)}% over budget` };
  return { points: 0, note: `${Math.round(over * 100)}% over budget` };
}

function score(app: Application, settings: ScoreSettings): ScoreResult {
  const p = app.profile;
  const lines: ScoreLine[] = [];
  const flags: string[] = [];
  const strengths: string[] = [];

  // Qualification (12)
  const q = pts(QUALIFICATIONS, p.qualification);
  lines.push({ label: "Qualification", points: q, max: 12, note: QUALIFICATIONS.find((o) => o.value === p.qualification)?.label });
  if (p.qualification === "fully_qualified") flags.push("Fully qualified — may get bored or become expensive in this role");
  if (["aat_progress", "degree", "none"].includes(String(p.qualification)))
    flags.push("Below the required qualification (part-qualified CA/CIMA or AAT finalist)");

  // Experience (13)
  const y = pts(YEARS, p.years);
  lines.push({ label: "Hands-on experience", points: y, max: 13, note: YEARS.find((o) => o.value === p.years)?.label });
  if (p.years === "lt1" || p.years === "1_2") flags.push("Less than 3 years of hands-on bookkeeping");
  // AAT finalist with stronger experience is acceptable per the brief
  if (p.qualification === "aat_finalist" && ["3_5", "6_8", "8plus"].includes(String(p.years))) {
    lines[0].points = Math.min(12, lines[0].points + 2);
    lines[0].note += " (with solid experience)";
  }

  // Multi-entity close (10)
  let e = pts(ENTITIES, p.entities);
  if (p.intercompany === "yes" && p.entities !== "0") e += 2;
  e = Math.min(10, e);
  lines.push({ label: "Multi-company month-end close", points: e, max: 10, note: ENTITIES.find((o) => o.value === p.entities)?.label });
  if (p.entities === "0") flags.push("Has never owned a month-end close");
  if (["2_3", "4plus"].includes(String(p.entities)) && p.intercompany === "yes")
    strengths.push("Has closed several companies at once, incl. inter-company");

  // Close discipline (5)
  const c = pts(CLOSE_DAY, p.close_day);
  lines.push({ label: "Close date discipline", points: c, max: 5, note: CLOSE_DAY.find((o) => o.value === p.close_day)?.label });
  if (p.close_day === "unsure") flags.push("Vague on close dates at last job");
  if (p.close_day === "gt15") flags.push("Books closed after working day 15 at last job");

  // Industry (10)
  const ind = arr(p.industry);
  const relevant = ind.filter((i) => RELEVANT_INDUSTRIES.includes(i));
  const i = ind.includes("fnb") ? 10 : relevant.length ? 8 : ind.length ? 2 : 0;
  lines.push({
    label: "Industry background",
    points: i,
    max: 10,
    note: ind.map((v) => INDUSTRIES.find((o) => o.value === v)?.label ?? v).join(", "),
  });
  if (ind.includes("fnb")) strengths.push("F&B background");

  // Tasks (30)
  const t = scoreTasks(taskGroups, app.tasks);
  const tp = Math.round(t.ratio * 30 * 10) / 10;
  lines.push({ label: "Divide task checklist", points: tp, max: 30, note: `${t.experienced}/${t.total} done before` });
  if (t.coreCannot >= 3) flags.push(`Can't do ${t.coreCannot} core tasks`);
  if (t.ratio >= 0.85) strengths.push("Has done most of the Divide task list");

  // Systems (5)
  const sw = arr(p.software);
  const hasCloud = sw.some((s) => CLOUD.includes(s));
  const excel = p.excel === "advanced" ? 2 : p.excel === "intermediate" ? 1 : 0;
  const sys = (hasCloud ? 2 : 0) + (p.coa_setup === "yes" ? 1 : 0) + excel;
  lines.push({ label: "Systems (cloud, chart of accounts, Excel)", points: sys, max: 5 });
  if (sw.length && !hasCloud) flags.push("Only desktop / legacy accounting software");

  // Working style (5)
  const ws =
    (p.sinhala === "fluent" ? 2 : p.sinhala === "conversational" ? 1 : 0) +
    (p.english === "strong" || p.english === "good" ? 1 : 0) +
    (p.outlet_visits === "yes" ? 2 : 0);
  lines.push({ label: "Language & outlet visits", points: ws, max: 5 });
  if (p.outlet_visits === "no") flags.push("Not willing to visit outlets");
  if (p.sinhala === "none") flags.push("No spoken Sinhala (needed for suppliers and outlet staff)");
  if (p.role_pref === "supervise") flags.push("Wants to supervise — there is nobody to supervise");
  if (p.strength === "tax") flags.push("Leads with tax planning (that's the tax consultant's job)");
  if (p.short_stints === "2plus") flags.push("Several job moves of under a year");
  if (p.data_entry_only === "yes") flags.push("Has mainly done data entry under a senior");

  // Availability (5)
  const n = NOTICE_OPTIONS.find((o) => o.value === app.noticePeriod)?.points ?? 0;
  lines.push({ label: "Availability", points: n, max: 5, note: NOTICE_OPTIONS.find((o) => o.value === app.noticePeriod)?.label });

  // Salary (5)
  const sal = scoreSalary(app, settings);
  lines.push({ label: "Salary vs budget", points: sal.points, max: 5, note: sal.note });
  if (sal.points === 0) flags.push("Salary expectation well above budget");

  // Nice to haves (bonus up to 5)
  const nice = arr(p.nice_to_have);
  if (nice.length) {
    lines.push({ label: "Nice-to-haves (bonus)", points: Math.min(5, nice.length), max: 0, note: `${nice.length} of ${NICE_TO_HAVE.length}` });
    if (nice.includes("franchise_acct")) strengths.push("Franchise / royalty accounting");
  }

  const total = Math.min(100, Math.round(lines.reduce((s, l) => s + l.points, 0)));
  const band = total >= 75 ? "strong" : total >= 60 ? "possible" : "weak";
  return { total, lines, flags, strengths, band };
}

export const accountant: Role = {
  slug: "accountant",
  title: "Accountant",
  team: "Finance",
  location: "Colombo, Sri Lanka · on-site with outlet visits",
  summary:
    "A hands-on accountant who owns the books for every Divide entity, closes each month on a fixed date and takes day-to-day accounting off the founders.",
  about: [
    "You'll own the books for every Divide company and outlet: reconciliations, suppliers, stock, payroll and franchise billing.",
    "Management accounts are due by working day 10 each month.",
    "This is a doer role — no team underneath. You'll visit outlets for stock counts and cash checks.",
    "The application takes about 10 minutes. Most of it is a checklist of the actual work you'd do here.",
  ],
  profileSections: [
    {
      title: "Qualifications & experience",
      description: "Keep it short — the next section covers the actual work.",
      questions: [
        { id: "qualification", label: "Highest accounting qualification", type: "select", options: QUALIFICATIONS, required: true },
        {
          id: "qualification_detail",
          label: "Stage reached (optional)",
          type: "text",
          placeholder: "e.g. CIMA Management level, CA Corporate level",
          maxLength: 120,
        },
        { id: "years", label: "Years of hands-on bookkeeping through to finalised accounts", type: "select", options: YEARS, required: true },
        {
          id: "current_role",
          label: "Current or most recent job title and company",
          type: "text",
          required: true,
          maxLength: 150,
          placeholder: "e.g. Senior Accounts Executive, ABC Restaurants (Pvt) Ltd",
        },
        { id: "industry", label: "Industries you've done accounts for", type: "multi", options: INDUSTRIES, required: true },
        {
          id: "entities",
          label: "Most companies you've closed monthly books for at the same time",
          type: "select",
          options: ENTITIES,
          required: true,
        },
        { id: "intercompany", label: "Have you handled inter-company balances?", type: "yesno", required: true },
        {
          id: "close_day",
          label: "At your current / last job, by which working day were the month's books closed?",
          type: "select",
          options: CLOSE_DAY,
          required: true,
        },
        { id: "software", label: "Accounting software you've used", type: "multi", options: SOFTWARE, required: true },
        { id: "coa_setup", label: "Have you set up a chart of accounts yourself (not only posted into one)?", type: "yesno", required: true },
        {
          id: "excel",
          label: "Excel / Google Sheets level",
          type: "select",
          required: true,
          options: [
            { value: "basic", label: "Basic — data entry and simple formulas" },
            { value: "intermediate", label: "Intermediate — lookups and pivots" },
            { value: "advanced", label: "Advanced — I build reconciliations from raw exports" },
          ],
        },
        {
          id: "data_entry_only",
          label: "Has most of your work been data entry checked by a senior?",
          type: "yesno",
          required: true,
        },
        {
          id: "short_stints",
          label: "In the last 5 years, how many jobs did you leave within a year?",
          type: "select",
          required: true,
          options: [
            { value: "0", label: "None" },
            { value: "1", label: "One" },
            { value: "2plus", label: "Two or more" },
          ],
        },
      ],
    },
    {
      title: "How you like to work",
      questions: [
        {
          id: "role_pref",
          label: "Which best describes the role you want next?",
          type: "select",
          required: true,
          options: [
            { value: "hands_on", label: "Hands-on — I want to own the books myself" },
            { value: "mix", label: "Mostly hands-on, with some reviewing" },
            { value: "supervise", label: "Mainly supervising a team" },
          ],
        },
        {
          id: "strength",
          label: "Your strongest area",
          type: "select",
          required: true,
          options: [
            { value: "close", label: "Month-end close & reconciliations" },
            { value: "reporting", label: "Management reporting" },
            { value: "stock", label: "Stock & costing" },
            { value: "payroll", label: "Payroll" },
            { value: "tax", label: "Tax planning & advisory" },
          ],
        },
        {
          id: "sinhala",
          label: "Spoken Sinhala",
          type: "select",
          required: true,
          options: [
            { value: "fluent", label: "Fluent" },
            { value: "conversational", label: "Conversational" },
            { value: "none", label: "None" },
          ],
        },
        {
          id: "english",
          label: "Written English",
          type: "select",
          required: true,
          options: [
            { value: "strong", label: "Strong — I write reports" },
            { value: "good", label: "Good" },
            { value: "basic", label: "Basic" },
          ],
        },
        { id: "outlet_visits", label: "Are you willing to visit outlets for stock counts and cash checks?", type: "yesno", required: true },
        { id: "nice_to_have", label: "Any of these? (tick all that apply)", type: "multi", options: NICE_TO_HAVE },
        {
          id: "recon_explain",
          label: "In 2–3 sentences: how do you reconcile a balance sheet account, e.g. a supplier control account?",
          type: "textarea",
          required: true,
          maxLength: 800,
        },
      ],
    },
  ],
  taskGroups,
  score,
};
