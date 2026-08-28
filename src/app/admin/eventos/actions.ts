"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { ok?: boolean; count?: number; error?: string };
const commonSchema = z.object({
  name: z.string().trim().min(3, "Escribe el nombre de la actividad."), description: z.string().trim().optional(),
  startsAt: z.string().min(1), endsAt: z.string().optional(), location: z.string().trim().optional(), mapUrl: z.string().trim().optional(), imageUrl: z.string().trim().optional(),
  categoryId: z.string().uuid(), ministryId: z.string().uuid().optional(), attendanceMode: z.enum(["none","rsvp","registration"]), capacity: z.coerce.number().int().positive().optional(),
  registrationDeadline: z.string().optional(), status: z.enum(["draft","published"]),
});

function optional(formData: FormData, key: string) { const value=String(formData.get(key) ?? "").trim(); return value || undefined; }
function localIso(value: string) { return `${value.length===16 ? `${value}:00` : value}-06:00`; }
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "actividad"; }
function dateOnly(input: string) { return input.split("T")[0]; }
function timeOnly(input: string) { return input.split("T")[1]?.slice(0,5) ?? "00:00"; }
function dayOfWeek(date: string) { const [y,m,d]=date.split("-").map(Number); return new Date(Date.UTC(y,m-1,d,12)).getUTCDay(); }
function addDays(date: string, amount: number) { const [y,m,d]=date.split("-").map(Number); const x=new Date(Date.UTC(y,m-1,d+amount,12)); return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,"0")}-${String(x.getUTCDate()).padStart(2,"0")}`; }
function compareDate(a: string,b: string) { return a.localeCompare(b); }

function recurringDates(start: string, kind: "single"|"weekly"|"monthly", until: string | undefined, weekdays: number[]) {
  if (kind==="single") return [start];
  if (!until || compareDate(until,start)<0) throw new Error("Selecciona una fecha final válida para la recurrencia.");
  const startMs=new Date(`${start}T12:00:00Z`).getTime(); const untilMs=new Date(`${until}T12:00:00Z`).getTime();
  if (untilMs-startMs>550*86400000) throw new Error("La recurrencia puede cubrir como máximo 18 meses.");
  const out:string[]=[];
  if (kind==="weekly") {
    const selected=weekdays.length ? new Set(weekdays) : new Set([dayOfWeek(start)]);
    for (let cursor=start, guard=0; compareDate(cursor,until)<=0 && guard<560; cursor=addDays(cursor,1),guard++) if (selected.has(dayOfWeek(cursor))) out.push(cursor);
  } else {
    const [sy,sm,sd]=start.split("-").map(Number); let year=sy, month=sm;
    for (let guard=0; guard<20; guard++) {
      const candidate=new Date(Date.UTC(year,month-1,sd,12));
      if (candidate.getUTCMonth()===month-1) {
        const key=`${year}-${String(month).padStart(2,"0")}-${String(sd).padStart(2,"0")}`;
        if (compareDate(key,start)>=0 && compareDate(key,until)<=0) out.push(key);
      }
      month++; if (month===13) { month=1; year++; }
      const monthStart=`${year}-${String(month).padStart(2,"0")}-01`; if (compareDate(monthStart,until)>0) break;
    }
  }
  if (!out.length) throw new Error("La recurrencia no generó ninguna fecha.");
  if (out.length>200) throw new Error("La serie tiene demasiadas actividades. Reduce el rango.");
  return out;
}

async function authStaff() {
  const supabase=await createClient(); const { data:{ user } }=await supabase.auth.getUser(); if (!user) return { error:"Debes iniciar sesión.", supabase, user:null };
  const { data:isStaff }=await supabase.rpc("is_staff"); if (!isStaff) return { error:"No tienes permiso para administrar eventos.", supabase, user:null };
  return { supabase, user, error:null };
}

function parseCommon(formData: FormData) {
  return commonSchema.safeParse({ name:formData.get("name"), description:optional(formData,"description"), startsAt:formData.get("startsAt"), endsAt:optional(formData,"endsAt"), location:optional(formData,"location"), mapUrl:optional(formData,"mapUrl"), imageUrl:optional(formData,"imageUrl"), categoryId:formData.get("categoryId"), ministryId:optional(formData,"ministryId"), attendanceMode:formData.get("attendanceMode") || "none", capacity:optional(formData,"capacity"), registrationDeadline:optional(formData,"registrationDeadline"), status:formData.get("status") || "published" });
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const parsed=parseCommon(formData); if (!parsed.success) return { error:parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  const recurrenceKind=(String(formData.get("recurrenceKind") ?? "single")) as "single"|"weekly"|"monthly";
  if (!["single","weekly","monthly"].includes(recurrenceKind)) return { error:"Recurrencia inválida." };
  const recurrenceUntil=optional(formData,"recurrenceUntil");
  const weekdays=formData.getAll("weekdays").map((v)=>Number(v)).filter((v)=>Number.isInteger(v)&&v>=0&&v<=6);
  const auth=await authStaff(); if (!auth.user) return { error:auth.error ?? "Sin permiso." };
  const startIso=localIso(parsed.data.startsAt); const startMs=new Date(startIso).getTime();
  const endMs=parsed.data.endsAt ? new Date(localIso(parsed.data.endsAt)).getTime() : null;
  if (endMs != null && endMs<=startMs) return { error:"La hora de finalización debe ser posterior al inicio." };
  const deadlineMs=parsed.data.registrationDeadline ? new Date(localIso(parsed.data.registrationDeadline)).getTime() : null;
  if (deadlineMs != null && deadlineMs>=startMs) return { error:"El cierre de inscripción debe ser antes del inicio." };
  let dates:string[]; try { dates=recurringDates(dateOnly(parsed.data.startsAt),recurrenceKind,recurrenceUntil,weekdays); } catch (e) { return { error:e instanceof Error ? e.message : "Recurrencia inválida." }; }
  const duration=endMs==null ? null : endMs-startMs; const deadlineLead=deadlineMs==null ? null : startMs-deadlineMs;
  const groupId=recurrenceKind==="single" ? null : crypto.randomUUID(); const time=timeOnly(parsed.data.startsAt); const baseSlug=slugify(parsed.data.name); const notify=formData.get("notify")==="on"; const featured=formData.get("isFeatured")==="on";
  const payload=dates.map((date,index)=>{
    const occurrenceStart=localIso(`${date}T${time}`); const occurrenceMs=new Date(occurrenceStart).getTime(); const suffix=`${date.replaceAll("-","")}-${time.replace(":","")}`;
    return { slug:`${baseSlug}-${suffix}`, name:parsed.data.name, description:parsed.data.description ?? null, starts_at:occurrenceStart, ends_at:duration==null ? null : new Date(occurrenceMs+duration).toISOString(), location:parsed.data.location ?? null, map_url:parsed.data.mapUrl ?? null, image_url:parsed.data.imageUrl ?? null, ministry_id:parsed.data.ministryId ?? null, category_id:parsed.data.categoryId, capacity:parsed.data.attendanceMode==="none" ? null : parsed.data.capacity ?? null, requires_registration:parsed.data.attendanceMode==="registration", attendance_mode:parsed.data.attendanceMode, registration_deadline:deadlineLead==null ? null : new Date(occurrenceMs-deadlineLead).toISOString(), status:parsed.data.status, recurrence_group_id:groupId, recurrence_kind:recurrenceKind, is_featured:featured, created_by:auth.user.id, notify_on_publish:notify && index===0 };
  });
  const { error }=await auth.supabase.from("events").insert(payload); if (error) return { error:`No se pudo guardar: ${error.message}` };
  revalidatePath("/admin/eventos"); revalidatePath("/eventos"); revalidatePath("/"); return { ok:true, count:payload.length };
}

export async function updateEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const id=String(formData.get("id") ?? ""); if (!id) return { error:"Evento inválido." };
  const parsed=parseCommon(formData); if (!parsed.success) return { error:parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  const auth=await authStaff(); if (!auth.user) return { error:auth.error ?? "Sin permiso." };
  const startMs=new Date(localIso(parsed.data.startsAt)).getTime(); const end=parsed.data.endsAt ? new Date(localIso(parsed.data.endsAt)) : null; if (end && end.getTime()<=startMs) return { error:"La hora de finalización debe ser posterior al inicio." };
  const deadline=parsed.data.registrationDeadline ? new Date(localIso(parsed.data.registrationDeadline)) : null; if (deadline && deadline.getTime()>=startMs) return { error:"El cierre de inscripción debe ser antes del inicio." };
  const { data:current }=await auth.supabase.from("events").select("slug").eq("id",id).maybeSingle(); if (!current) return { error:"Evento no encontrado." };
  const { error }=await auth.supabase.from("events").update({ name:parsed.data.name, description:parsed.data.description ?? null, starts_at:localIso(parsed.data.startsAt), ends_at:end?.toISOString() ?? null, location:parsed.data.location ?? null, map_url:parsed.data.mapUrl ?? null, image_url:parsed.data.imageUrl ?? null, ministry_id:parsed.data.ministryId ?? null, category_id:parsed.data.categoryId, capacity:parsed.data.attendanceMode==="none" ? null : parsed.data.capacity ?? null, requires_registration:parsed.data.attendanceMode==="registration", attendance_mode:parsed.data.attendanceMode, registration_deadline:deadline?.toISOString() ?? null, status:parsed.data.status, is_featured:formData.get("isFeatured")==="on", notify_on_publish:formData.get("notify")==="on" }).eq("id",id);
  if (error) return { error:error.message }; revalidatePath("/admin/eventos"); revalidatePath(`/eventos/${current.slug}`); revalidatePath("/eventos"); return { ok:true };
}

export async function cancelEvent(formData: FormData) {
  const id=String(formData.get("id") ?? ""); const scope=String(formData.get("scope") ?? "one"); if (!id) return;
  const auth=await authStaff(); if (!auth.user) return;
  const { data:event }=await auth.supabase.from("events").select("id,recurrence_group_id,starts_at").eq("id",id).maybeSingle(); if (!event) return;
  if (scope==="series" && event.recurrence_group_id) await auth.supabase.from("events").update({ status:"cancelled" }).eq("recurrence_group_id",event.recurrence_group_id).gte("starts_at",event.starts_at);
  else await auth.supabase.from("events").update({ status:"cancelled" }).eq("id",id);
  revalidatePath("/admin/eventos"); revalidatePath("/eventos");
}
