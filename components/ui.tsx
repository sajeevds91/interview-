import type { ScoreResult } from "@/lib/roles/types";
import { STATUSES, type Status } from "@/lib/candidates";

export function Score({ s, big }: { s: ScoreResult; big?: boolean }) {
  return <span className={`score ${s.band} ${big ? "big" : ""}`} title={`${s.band} fit`}>{s.total}</span>;
}

const STATUS_TONE: Record<Status, string> = {
  new: "",
  shortlisted: "accent",
  invited: "warn",
  scheduled: "good",
  interviewed: "accent",
  offer: "good",
  hired: "good",
  rejected: "bad",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge ${STATUS_TONE[status]}`}>{STATUSES.find((s) => s.value === status)?.label ?? status}</span>;
}

export function Stars({ n }: { n?: number }) {
  if (!n) return <span className="tiny">—</span>;
  return <span aria-label={`${n} of 5`} style={{ color: "#c08a00", letterSpacing: 1 }}>{"★".repeat(n)}<span style={{ color: "var(--line)" }}>{"★".repeat(5 - n)}</span></span>;
}

export const lkr = (n: number) => "LKR " + Math.round(n).toLocaleString("en-US");
