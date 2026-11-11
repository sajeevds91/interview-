"use server";

import { bookSlot } from "@/lib/candidates";

export async function bookAction(token: string, startIso: string) {
  const r = await bookSlot(token, startIso);
  return r.ok ? { ok: true as const } : { ok: false as const, error: r.error };
}
