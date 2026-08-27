"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sleep } from "@/lib/utils";
import { notifyCareTeam } from "@/lib/care/notify";

const prayerSchema = z.object({
  body: z.string().trim().min(10, "Cuéntanos un poco más para poder orar contigo.").max(2000),
  category: z.enum(["salud", "familia", "provision", "gratitud", "duelo", "espiritual", "trabajo", "general"]),
  isPublic: z.coerce.boolean(),
  isAnonymous: z.coerce.boolean(),
  allowContact: z.coerce.boolean(),
  contactInfo: z.string().trim().max(200).optional(),
}).superRefine((data, ctx) => {
  if (data.allowContact && !data.contactInfo) {
    ctx.addIssue({ code: "custom", path: ["contactInfo"], message: "Indica cómo podemos contactarte." });
  }
});

const careSchema = z.object({
  requestType: z.enum(["counseling", "hospital_visit", "home_visit"]),
  requesterName: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  contactPhone: z.string().trim().max(40).optional().default(""),
  contactEmail: z.string().trim().max(160).optional().default(""),
  preferredContact: z.enum(["whatsapp", "phone", "email"]),
  message: z.string().trim().min(10, "Cuéntanos brevemente cómo podemos acompañarte.").max(3000),
  priority: z.enum(["normal", "soon", "urgent"]),
  subjectName: z.string().trim().max(120).optional().default(""),
  relationshipToSubject: z.string().trim().max(120).optional().default(""),
  hospitalName: z.string().trim().max(180).optional().default(""),
  roomDetails: z.string().trim().max(120).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  municipality: z.string().trim().max(120).optional().default(""),
  locationNotes: z.string().trim().max(500).optional().default(""),
  preferredSchedule: z.string().trim().max(300).optional().default(""),
  consentToContact: z.coerce.boolean(),
  consentToVisit: z.coerce.boolean(),
}).superRefine((data, ctx) => {
  if (!data.contactPhone && !data.contactEmail) {
    ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "Necesitamos un teléfono o correo para responderte." });
  }
  if (data.contactEmail && !z.string().email().safeParse(data.contactEmail).success) {
    ctx.addIssue({ code: "custom", path: ["contactEmail"], message: "El correo no parece válido." });
  }
  if (!data.consentToContact) {
    ctx.addIssue({ code: "custom", path: ["consentToContact"], message: "Necesitamos tu autorización para contactarte." });
  }
  if (data.requestType === "hospital_visit") {
    if (!data.subjectName) ctx.addIssue({ code: "custom", path: ["subjectName"], message: "Indica el nombre de la persona a visitar." });
    if (!data.hospitalName) ctx.addIssue({ code: "custom", path: ["hospitalName"], message: "Indica el hospital o centro de salud." });
    if (!data.consentToVisit) ctx.addIssue({ code: "custom", path: ["consentToVisit"], message: "Confirma que la persona o su responsable acepta la visita." });
  }
  if (data.requestType === "home_visit") {
    if (!data.address) ctx.addIssue({ code: "custom", path: ["address"], message: "Indica la dirección para coordinar la visita." });
    if (!data.consentToVisit) ctx.addIssue({ code: "custom", path: ["consentToVisit"], message: "Confirma que la persona o familia acepta la visita." });
  }
});

export type PrayerFormState = { ok?: boolean; error?: string };
export type CareFormState = { ok?: boolean; error?: string; tracking?: boolean };

export async function submitPrayerRequest(
  _prev: PrayerFormState,
  formData: FormData
): Promise<PrayerFormState> {
  const parsed = prayerSchema.safeParse({
    body: formData.get("body"),
    category: formData.get("category"),
    isPublic: formData.get("isPublic") === "on",
    isAnonymous: formData.get("isAnonymous") === "on",
    allowContact: formData.get("allowContact") === "on",
    contactInfo: formData.get("contactInfo") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("prayer_requests").insert({
    user_id: user?.id ?? null,
    body: parsed.data.body,
    category: parsed.data.category,
    is_public: parsed.data.isPublic,
    is_anonymous: parsed.data.isAnonymous,
    allow_pastoral_contact: parsed.data.allowContact,
    contact_info: parsed.data.allowContact ? parsed.data.contactInfo || null : null,
    status: "pending",
  });

  if (error) return { error: "No pudimos enviar tu petición. Intenta de nuevo." };
  void notifyCareTeam("prayer");
  await sleep(300);
  revalidatePath("/oracion");
  revalidatePath("/oracion/mis-solicitudes");
  revalidatePath("/admin/cuidado");
  return { ok: true };
}

export async function submitCareRequest(
  _prev: CareFormState,
  formData: FormData
): Promise<CareFormState> {
  const parsed = careSchema.safeParse({
    requestType: formData.get("requestType"),
    requesterName: formData.get("requesterName"),
    contactPhone: formData.get("contactPhone") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    preferredContact: formData.get("preferredContact"),
    message: formData.get("message"),
    priority: formData.get("priority"),
    subjectName: formData.get("subjectName") ?? "",
    relationshipToSubject: formData.get("relationshipToSubject") ?? "",
    hospitalName: formData.get("hospitalName") ?? "",
    roomDetails: formData.get("roomDetails") ?? "",
    address: formData.get("address") ?? "",
    municipality: formData.get("municipality") ?? "",
    locationNotes: formData.get("locationNotes") ?? "",
    preferredSchedule: formData.get("preferredSchedule") ?? "",
    consentToContact: formData.get("consentToContact") === "on",
    consentToVisit: formData.get("consentToVisit") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const d = parsed.data;

  const { error } = await supabase.from("care_requests").insert({
    user_id: user?.id ?? null,
    request_type: d.requestType,
    requester_name: d.requesterName,
    contact_phone: d.contactPhone || null,
    contact_email: d.contactEmail || null,
    preferred_contact: d.preferredContact,
    message: d.message,
    priority: d.priority,
    subject_name: d.requestType === "hospital_visit" ? d.subjectName || null : null,
    relationship_to_subject: d.requestType === "hospital_visit" ? d.relationshipToSubject || null : null,
    hospital_name: d.requestType === "hospital_visit" ? d.hospitalName || null : null,
    room_details: d.requestType === "hospital_visit" ? d.roomDetails || null : null,
    address: d.requestType === "home_visit" ? d.address || null : null,
    municipality: d.requestType === "home_visit" ? d.municipality || null : null,
    location_notes: ["hospital_visit", "home_visit"].includes(d.requestType) ? d.locationNotes || null : null,
    preferred_schedule: d.preferredSchedule || null,
    consent_to_contact: true,
    consent_to_visit: d.requestType === "counseling" ? false : d.consentToVisit,
    status: "new",
  });

  if (error) return { error: "No pudimos registrar tu solicitud. Intenta de nuevo." };
  void notifyCareTeam(d.requestType);
  revalidatePath("/oracion/mis-solicitudes");
  revalidatePath("/admin/cuidado");
  revalidatePath("/cuidado");
  return { ok: true, tracking: !!user };
}

export async function markPraying(prayerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("prayer_interactions").upsert({ user_id: user.id, prayer_id: prayerId });
  revalidatePath("/oracion");
}
