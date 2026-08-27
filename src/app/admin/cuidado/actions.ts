"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyPublishedPrayer } from "@/lib/care/notify";

async function requireCareAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roleSet = new Set((roles ?? []).map((row) => row.role));
  if (!roleSet.has("admin") && !roleSet.has("superadmin")) throw new Error("Sin permiso");
  return { supabase, user };
}

function refreshCare() {
  revalidatePath("/admin/cuidado");
  revalidatePath("/cuidado");
  revalidatePath("/oracion");
  revalidatePath("/oracion/mis-solicitudes");
}

const idSchema = z.string().uuid();

export async function moderatePrayer(formData: FormData) {
  const prayerId = idSchema.parse(formData.get("prayerId"));
  const status = z.enum(["approved", "rejected", "answered"]).parse(formData.get("status"));
  const { supabase } = await requireCareAdmin();

  const { data: currentPrayer, error: readError } = await supabase
    .from("prayer_requests")
    .select("is_public,status")
    .eq("id", prayerId)
    .single();
  if (readError || !currentPrayer) throw new Error(readError?.message ?? "Petición no encontrada");

  const update: { status: string; answered_at?: string | null } = { status };
  update.answered_at = status === "answered" ? new Date().toISOString() : null;
  const { error } = await supabase.from("prayer_requests").update(update).eq("id", prayerId);
  if (error) throw new Error(error.message);

  if (status === "approved" && currentPrayer.is_public && currentPrayer.status !== "approved") {
    await notifyPublishedPrayer(prayerId);
  }

  refreshCare();
}

export async function updateCareStatus(formData: FormData) {
  const requestId = idSchema.parse(formData.get("requestId"));
  const status = z.enum(["new", "reviewing", "assigned", "contacted", "scheduled", "completed", "closed"]).parse(formData.get("status"));
  const { supabase } = await requireCareAdmin();
  const terminal = status === "completed" || status === "closed";
  const { error } = await supabase
    .from("care_requests")
    .update({ status, completed_at: terminal ? new Date().toISOString() : null })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  refreshCare();
}

export async function saveCareTeamMember(formData: FormData) {
  const userId = idSchema.parse(formData.get("userId"));
  const { supabase, user } = await requireCareAdmin();
  const capabilities = {
    user_id: userId,
    can_counseling: formData.get("canCounseling") === "on",
    can_hospital_visit: formData.get("canHospitalVisit") === "on",
    can_home_visit: formData.get("canHomeVisit") === "on",
    can_prayer_followup: formData.get("canPrayerFollowup") === "on",
    can_triage: formData.get("canTriage") === "on",
    notify_new_requests: formData.get("notifyNewRequests") === "on",
    active: true,
    added_by: user.id,
  };
  if (!capabilities.can_counseling && !capabilities.can_hospital_visit && !capabilities.can_home_visit && !capabilities.can_prayer_followup && !capabilities.can_triage) {
    throw new Error("Selecciona al menos una función para esta persona.");
  }
  const { error } = await supabase.from("care_team_members").upsert(capabilities, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  refreshCare();
}

export async function setCareTeamMemberActive(formData: FormData) {
  const userId = idSchema.parse(formData.get("userId"));
  const active = formData.get("active") === "true";
  const { supabase } = await requireCareAdmin();
  const { error } = await supabase.from("care_team_members").update({ active }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  refreshCare();
}

export async function assignCareRequest(formData: FormData) {
  const requestId = idSchema.parse(formData.get("requestId"));
  const userId = idSchema.parse(formData.get("userId"));
  const { supabase, user } = await requireCareAdmin();

  const { error: assignmentError } = await supabase.from("care_assignments").upsert({
    request_id: requestId,
    user_id: userId,
    assigned_by: user.id,
  });
  if (assignmentError) throw new Error(assignmentError.message);

  const { error: statusError } = await supabase.from("care_requests").update({ status: "assigned" }).eq("id", requestId);
  if (statusError) throw new Error(statusError.message);
  refreshCare();
}

export async function unassignCareRequest(formData: FormData) {
  const requestId = idSchema.parse(formData.get("requestId"));
  const userId = idSchema.parse(formData.get("userId"));
  const { supabase } = await requireCareAdmin();
  const { error } = await supabase.from("care_assignments").delete().eq("request_id", requestId).eq("user_id", userId);
  if (error) throw new Error(error.message);
  refreshCare();
}

export async function addCareNote(formData: FormData) {
  const requestId = idSchema.parse(formData.get("requestId"));
  const note = z.string().trim().min(2).max(3000).parse(formData.get("note"));
  const { supabase, user } = await requireCareAdmin();
  const { error } = await supabase.from("care_request_notes").insert({
    request_id: requestId,
    author_id: user.id,
    note,
  });
  if (error) throw new Error(error.message);
  refreshCare();
}
