"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(roles ?? []).some((r) => r.role === "admin" || r.role === "superadmin")) throw new Error("Sin permiso");
  return { supabase, user };
}

export async function saveCareLeadershipMember(formData: FormData) {
  const userId = z.string().uuid().parse(formData.get("userId"));
  const { supabase, user } = await requireAdmin();
  const isSupervisor = formData.get("isSupervisor") === "on";
  const leadPrayer = formData.get("leadPrayer") === "on";
  const leadCounseling = formData.get("leadCounseling") === "on";
  const leadHospital = formData.get("leadHospitalVisit") === "on";
  const leadHome = formData.get("leadHomeVisit") === "on";
  const row = {
    user_id: userId,
    ministry_title: z.string().trim().max(120).optional().parse(formData.get("ministryTitle") || undefined) ?? (isSupervisor ? "Pastor supervisor" : null),
    is_supervisor: isSupervisor,
    can_prayer_followup: isSupervisor || leadPrayer || formData.get("canPrayerFollowup") === "on",
    can_counseling: isSupervisor || leadCounseling || formData.get("canCounseling") === "on",
    can_hospital_visit: isSupervisor || leadHospital || formData.get("canHospitalVisit") === "on",
    can_home_visit: isSupervisor || leadHome || formData.get("canHomeVisit") === "on",
    lead_prayer: !isSupervisor && leadPrayer,
    lead_counseling: !isSupervisor && leadCounseling,
    lead_hospital_visit: !isSupervisor && leadHospital,
    lead_home_visit: !isSupervisor && leadHome,
    can_triage: isSupervisor || formData.get("canTriage") === "on",
    can_assign: isSupervisor || formData.get("canAssign") === "on",
    can_manage_status: isSupervisor || formData.get("canManageStatus") === "on",
    notify_new_requests: isSupervisor || formData.get("notifyNewRequests") === "on",
    notify_urgent: formData.get("notifyUrgent") === "on",
    notify_assignment: formData.get("notifyAssignment") === "on",
    active: true,
    added_by: user.id,
  };
  if (!row.can_prayer_followup && !row.can_counseling && !row.can_hospital_visit && !row.can_home_visit && !row.can_triage && !row.is_supervisor) throw new Error("Selecciona al menos un área de servicio.");
  const { error } = await supabase.from("care_team_members").upsert(row, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cuidado/equipo"); revalidatePath("/admin/cuidado"); revalidatePath("/cuidado");
}

export async function setCareLeadershipActive(formData: FormData) {
  const userId = z.string().uuid().parse(formData.get("userId"));
  const active = formData.get("active") === "true";
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("care_team_members").update({ active }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cuidado/equipo"); revalidatePath("/cuidado");
}
