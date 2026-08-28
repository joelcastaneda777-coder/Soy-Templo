"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AttendanceState = { ok?: boolean; error?: string; needsLogin?: boolean };

export async function setEventAttendance(_prev: AttendanceState, formData: FormData): Promise<AttendanceState> {
  const eventId = String(formData.get("eventId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const intent = String(formData.get("intent") ?? "join");
  const requestedParty = Number(formData.get("partySize") ?? 1);
  if (!eventId || !slug) return { error: "Evento inválido." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para confirmar tu asistencia.", needsLogin: true };

  const { data: event } = await supabase.from("events")
    .select("id,attendance_mode,starts_at,registration_deadline,status,capacity")
    .eq("id", eventId).eq("status", "published").maybeSingle();
  if (!event || event.attendance_mode === "none" || new Date(event.starts_at) <= new Date()) return { error: "Este evento ya no admite confirmaciones." };
  if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) return { error: "La inscripción ya cerró." };

  const { data: existing } = await supabase.from("event_registrations").select("id,status")
    .eq("event_id", eventId).eq("user_id", user.id).eq("status", "active").maybeSingle();

  if (intent === "cancel") {
    if (existing) {
      const { error } = await supabase.from("event_registrations").update({ status: "cancelled" }).eq("id", existing.id).eq("user_id", user.id);
      if (error) return { error: error.message };
    }
    revalidatePath(`/eventos/${slug}`); revalidatePath("/eventos");
    return { ok: true };
  }

  const partySize = Number.isInteger(requestedParty) ? Math.max(1, Math.min(requestedParty, 20)) : 1;
  const registrationType = event.attendance_mode === "rsvp" ? "rsvp" : "registration";
  const result = existing
    ? await supabase.from("event_registrations").update({ party_size: partySize, registration_type: registrationType }).eq("id", existing.id).eq("user_id", user.id)
    : await supabase.from("event_registrations").insert({ event_id: eventId, user_id: user.id, registration_type: registrationType, party_size: partySize, status: "active" });
  if (result.error) return { error: result.error.message };
  revalidatePath(`/eventos/${slug}`); revalidatePath("/eventos");
  return { ok: true };
}
