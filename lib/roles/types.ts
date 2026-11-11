export type Option = { value: string; label: string };

export type Question = {
  id: string;
  label: string;
  help?: string;
  type: "select" | "multi" | "yesno" | "text" | "textarea";
  options?: Option[];
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
};

export type TaskAnswer = "experienced" | "can_do" | "cannot";

export const TASK_ANSWERS: { value: TaskAnswer; label: string; short: string }[] = [
  { value: "experienced", label: "I have done this", short: "Done it" },
  { value: "can_do", label: "I can do this / learn it quickly", short: "Can do" },
  { value: "cannot", label: "I can't do this", short: "Can't" },
];

export type Task = {
  id: string;
  label: string;
  /** 1 = normal, 2 = important, 3 = core to the role */
  weight: 1 | 2 | 3;
};

export type TaskGroup = {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
};

export type Application = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  cvLink?: string;
  noticePeriod: string;
  earliestStart?: string;
  salaryExpectation: number;
  salaryNegotiable: boolean;
  profile: Record<string, string | string[]>;
  tasks: Record<string, TaskAnswer>;
};

export type ScoreSettings = {
  salaryBudgetMin: number;
  salaryBudgetMax: number;
};

export type ScoreLine = { label: string; points: number; max: number; note?: string };

export type ScoreResult = {
  total: number;
  lines: ScoreLine[];
  flags: string[];
  strengths: string[];
  band: "strong" | "possible" | "weak";
};

export type Role = {
  slug: string;
  title: string;
  team: string;
  location: string;
  summary: string;
  about: string[];
  profileSections: { title: string; description?: string; questions: Question[] }[];
  taskGroups: TaskGroup[];
  score: (app: Application, settings: ScoreSettings) => ScoreResult;
};

export const NOTICE_OPTIONS: (Option & { points: number })[] = [
  { value: "immediate", label: "Can start immediately", points: 5 },
  { value: "2w", label: "2 weeks", points: 4 },
  { value: "1m", label: "1 month", points: 3 },
  { value: "2m", label: "2 months", points: 1 },
  { value: "3m", label: "3 months or more", points: 0 },
];

export function noticeLabel(v: string) {
  return NOTICE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}
