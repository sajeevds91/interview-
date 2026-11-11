"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  cancelInterview,
  deleteCandidate,
  inviteToInterview,
  rejectCandidate,
  STATUSES,
  updateCandidate,
  type Status,
} from "@/lib/candidates";

const path = (id: string) => `/admin/candidates/${id}`;

export async function inviteAction(id: string) {
  await requireAdmin();
  await inviteToInterview(id);
  revalidatePath(path(id));
}

export async function cancelInterviewAction(id: string) {
  await requireAdmin();
  await cancelInterview(id);
  revalidatePath(path(id));
}

export async function rejectAction(id: string, formData: FormData) {
  await requireAdmin();
  await rejectCandidate(id, formData.get("notify") === "on");
  revalidatePath(path(id));
}

export async function saveReviewAction(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status")) as Status;
  const rating = Number(formData.get("rating"));
  await updateCandidate(
    id,
    {
      status: STATUSES.some((s) => s.value === status) ? status : undefined,
      notes: String(formData.get("notes") ?? "").slice(0, 5000),
      manualRating: rating >= 1 && rating <= 5 ? rating : undefined,
    },
    formData.get("statusChanged") === "1" ? `Status set to ${STATUSES.find((s) => s.value === status)?.label}` : undefined,
  );
  revalidatePath(path(id));
}

export async function deleteAction(id: string) {
  await requireAdmin();
  await deleteCandidate(id);
  redirect("/admin");
}
