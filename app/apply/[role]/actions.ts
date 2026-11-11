"use server";

import { createCandidate } from "@/lib/candidates";
import { getRole } from "@/lib/roles";
import { validateApplication } from "@/lib/validate";

export async function submitApplication(roleSlug: string, raw: unknown) {
  const role = getRole(roleSlug);
  if (!role) return { ok: false as const, errors: { form: "This role is no longer open." } };
  // Honeypot: real people never fill this hidden field.
  if ((raw as any)?.website) return { ok: true as const };
  const { app, errors } = validateApplication(role, raw);
  if (!app) return { ok: false as const, errors };
  try {
    await createCandidate(role.slug, app);
  } catch (e) {
    console.error(e);
    return { ok: false as const, errors: { form: "Something went wrong saving your application. Please try again." } };
  }
  return { ok: true as const };
}
