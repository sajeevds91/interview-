import { accountant } from "./accountant";
import type { Role } from "./types";

/** Add new roles here; each gets its own form at /apply/<slug>. */
export const ROLES: Role[] = [accountant];

export function getRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}
