"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  title: z.string().trim().min(3, "Escribe un título."),
  description: z.string().trim().min(5, "Escribe una descripción."),
  category: z.string().trim().min(1),
  kind: z.string().trim().min(1),
  priority: z.coerce.number().int().min(0).max(100),
  publishAt: z.string().trim().min(1, "Selecciona cuándo publicar."),
  expiresAt: z.string().trim().optional(),
  effectiveAt: z.string().trim().min(1, "Selecciona cuándo aplica el anuncio."),
  effectiveUntil: z.string().trim().optional(),
  actionLabel: z.string().trim().optional(),
  actionUrl: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
});

export type AnnouncementState = { ok?: boolean; error?: string };
function localToIsoWithOffset(value: string) { return value ? `${value.length === 16 ? value + ":00" : value}-06:00` : null; }

export async function createAnnouncement(_prev: AnnouncementState, formData: FormData): Promise<AnnouncementState> {
  const parsed = schema.safeParse({
    title: formData.get("title"), description: formData.get("description"), category: formData.get("category"), kind: formData.get("kind") || "aviso",
    priority: formData.get("priority") || 0, publishAt: formData.get("publishAt"), expiresAt: String(formData.get("expiresAt") ?? "").trim() || undefined,
    effectiveAt: formData.get("effectiveAt"), effectiveUntil: String(formData.get("effectiveUntil") ?? "").trim() || undefined,
    actionLabel: String(formData.get("actionLabel") ?? "").trim() || undefined, actionUrl: String(formData.get("actionUrl") ?? "").trim() || undefined,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  if (parsed.data.actionUrl && !/^https?:\/\//i.test(parsed.data.actionUrl) && !parsed.data.actionUrl.startsWith("/")) return { error: "El enlace debe comenzar con https:// o con /." };
  const effectiveAt = localToIsoWithOffset(parsed.data.effectiveAt);
  const effectiveUntil = parsed.data.effectiveUntil ? localToIsoWithOffset(parsed.data.effectiveUntil) : null;
  if (effectiveAt && effectiveUntil && new Date(effectiveUntil) < new Date(effectiveAt)) return { error: "La fecha final no puede ser anterior a la fecha aplicable." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };
  const { data: isStaff } = await supabase.rpc("is_staff");
  if (!isStaff) return { error: "No tienes permiso para publicar anuncios." };

  const { error } = await supabase.from("announcements").insert({
    title: parsed.data.title, description: parsed.data.description, category: parsed.data.category, announcement_kind: parsed.data.kind,
    priority: parsed.data.priority, publish_at: localToIsoWithOffset(parsed.data.publishAt), expires_at: parsed.data.expiresAt ? localToIsoWithOffset(parsed.data.expiresAt) : null,
    effective_at: effectiveAt, effective_until: effectiveUntil, action_label: parsed.data.actionLabel || null, action_url: parsed.data.actionUrl || null,
    image_url: parsed.data.imageUrl || null, is_featured: formData.get("isFeatured") === "on", display_on_agenda: false, status: "published", created_by: user.id,
  });
  if (error) return { error: `No se pudo guardar el anuncio: ${error.message}` };
  revalidatePath("/admin/anuncios"); revalidatePath("/anuncios"); revalidatePath("/");
  return { ok: true };
}

export async function archiveAnnouncement(formData: FormData) {
  const id = String(formData.get("id") ?? ""); if (!id) return;
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
  const { data: isStaff } = await supabase.rpc("is_staff"); if (!isStaff) return;
  await supabase.from("announcements").update({ status: "archived" }).eq("id", id);
  revalidatePath("/admin/anuncios"); revalidatePath("/anuncios"); revalidatePath("/");
}
