"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireCareWorker() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const [{ data: member }, { data: roles }] = await Promise.all([
    supabase.from("care_team_members").select("active,can_triage").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const isAdmin = (roles ?? []).some((row) => row.role === "admin" || row.role === "superadmin");
  if (!isAdmin && !member?.active) throw new Error("Sin acceso al equipo de cuidado");
  return { supabase, user };
}

function refresh() {
  revalidatePath("/cuidado");
  revalidatePath("/admin/cuidado");
  revalidatePath("/oracion/mis-solicitudes");
}

export async function updateAssignedCareStatus(formData: FormData) {
  const requestId = z.string().uuid().parse(formData.get("requestId"));
  const status = z.enum(["contacted", "scheduled", "completed"]).parse(formData.get("status"));
  const { supabase } = await requireCareWorker();
  const { error } = await supabase
    .from("care_requests")
    .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
    .eq("id", requestId);
  if (error) throw new Error("No tienes permiso para actualizar este caso o ocurrió un error.");
  refresh();
}

export async function addAssignedCareNote(formData: FormData) {
  const requestId = z.string().uuid().parse(formData.get("requestId"));
  const note = z.string().trim().min(2).max(3000).parse(formData.get("note"));
  const { supabase, user } = await requireCareWorker();
  const { error } = await supabase.from("care_request_notes").insert({
    request_id: requestId,
    author_id: user.id,
    note,
  });
  if (error) throw new Error("No tienes permiso para agregar una nota a este caso.");
  refresh();
}
